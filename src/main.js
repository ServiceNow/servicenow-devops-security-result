const core = require('@actions/core');
const axios = require('axios');

function circularSafeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });
}

(async function main() {
    let instanceUrl = core.getInput('instance-url', { required: true });
    const toolId = core.getInput('tool-id', { required: true });
    const username = core.getInput('devops-integration-user-name');
    const password = core.getInput('devops-integration-user-password');
    const token = core.getInput('devops-integration-token');
    const jobname = core.getInput('job-name', { required: true });
    let securityResultAttributes = core.getInput('security-result-attributes', { required: true });
    let githubContext = core.getInput('context-github', { required: true });

    try {
        githubContext = JSON.parse(githubContext);
    } catch (e) {
        core.setFailed(`Exception while parsing github context ${e}`);
    }


    try {
        securityResultAttributes = JSON.parse(securityResultAttributes);
    } catch (e) {
        core.setFailed(`Exception while parsing securityResultAttributes ${e}`);
    }

    let payload;

    try {
        instanceUrl = instanceUrl.trim();
        if (instanceUrl.endsWith('/'))
            instanceUrl = instanceUrl.slice(0, -1);

        pipelineInfo = {
            toolId: toolId,
            runId: `${githubContext.run_id}`,
            runNumber: `${githubContext.run_number}`,
            runAttempt: `${githubContext.run_attempt}`,
            job: `${jobname}`,
            sha: `${githubContext.sha}`,
            workflow: `${githubContext.workflow}`,
            repository: `${githubContext.repository}`,
            ref: `${githubContext.ref}`,
            refName: `${githubContext.ref_name}`,
            refType: `${githubContext.ref_type}`
        };

        payload = {
            pipelineInfo: pipelineInfo,
            securityResultAttributes: securityResultAttributes
        };

        core.debug('Security scan results Custon Action payload is : ${JSON.stringify(pipelineInfo)}\n\n');
    } catch (e) {
        core.setFailed(`Exception setting the payload ${e}`);
        return;
    }

    try {
        if (token === '' && username === '' && password === '') {
            core.setFailed('Either a secret token or an integration username and password is needed for integration user authentication');
            return;
        }
        else if (token !== '') {
            restEndpoint = `${instanceUrl}/api/sn_devops/v2/devops/tool/security?toolId=${toolId}`;
            const defaultHeadersForToken = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'sn_devops.DevOpsToken ' + `${toolId}:${token}`
            };
            httpHeaders = { headers: defaultHeadersForToken };
        }
        else if (username !== '' && password !== '') {
            restEndpoint = `${instanceUrl}/api/sn_devops/v1/devops/tool/security?toolId=${toolId}`;
            const tokenBasicAuth = `${username}:${password}`;
            const encodedTokenForBasicAuth = Buffer.from(tokenBasicAuth).toString('base64');

            const defaultHeadersForBasicAuth = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + `${encodedTokenForBasicAuth}`
            };
            httpHeaders = { headers: defaultHeadersForBasicAuth };
        }
        else {
            core.setFailed('For Basic Auth, both a username and password are mandatory for integration user authentication.');
            return;
        }

        responseData = await axios.post(restEndpoint, JSON.stringify(payload), httpHeaders);

        if (responseData.data && responseData.data.result)
            console.log("\n \x1b[1m\x1b[32m SUCCESS: Security Scan registration was successful" + '\x1b[0m\x1b[0m');
        else
            console.log("FAILED: Security Scan could not be registered");
    } catch (e) {
        core.debug('[ServiceNow DevOps] Security Scan Results, Error: '+JSON.stringify(e));
        if(e.response && e.response.data) {
            var responseObject=circularSafeStringify(e.response.data);
            core.debug('[ServiceNow DevOps] Security Scan Results, Status code :'+e.response.statusCode+', Response data :'+responseObject);          
        }

        if (e.message.includes('ECONNREFUSED') || e.message.includes('ENOTFOUND') || e.message.includes('405')) {
            core.setFailed('ServiceNow Instance URL is NOT valid. Please correct the URL and try again.');
        } else if (e.message.includes('401')) {
            core.setFailed('Invalid username and password or Invalid token and toolid. Please correct the input parameters and try again.');
        } else if(e.message.includes('400') || e.message.includes('404')){
            let errMsg = '[ServiceNow DevOps] Security Scan Results are not Successful. ';
            let errMsgSuffix = ' Please provide valid inputs.';
            let responseData = e.response.data;
            if (responseData && responseData.result && responseData.result.errorMessage) {
                errMsg = errMsg + responseData.result.errorMessage + errMsgSuffix;
                core.setFailed(errMsg);
            }
            else if (responseData && responseData.result && responseData.result.details && responseData.result.details.errors) {
                let errors = responseData.result.details.errors;
                for (var index in errors) {
                    errMsg = errMsg + errors[index].message + errMsgSuffix;
                }
                core.setFailed(errMsg);
            }
        } else {
            core.setFailed(`ServiceNow Security Scan Results are NOT created. Please check ServiceNow logs for more details.`);
        }
    }

})();