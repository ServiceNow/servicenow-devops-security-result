# ServiceNow DevOps Register Security Scan Results GitHub Action

This custom action needs to be added at step level in a job to register security scan resutls in ServiceNow instance.

# Usage
## Step 1: Prepare values for setting up your secrets for Actions
- credentials (Devops integration token of a GitHub tool created in ServiceNow DevOps or username and password for a ServiceNow devops integration user)
- instance URL for your ServiceNow dev, test, prod, etc. environments
- tool_id of your GitHub tool created in ServiceNow DevOps

## Step 2: Configure Secrets in your GitHub Ogranization or GitHub repository
On GitHub, go in your organization settings or repository settings, click on the _Secrets > Actions_ and create a new secret.

Create secrets called 
For token based authentication which is available from v1.39.0, create secrets called 
- `SN_DEVOPS_INTEGRATION_TOKEN` required for token based authentication
- `SN_INSTANCE_URL` your ServiceNow instance URL, for example **https://test.service-now.com**
- `SN_ORCHESTRATION_TOOL_ID` only the **sys_id** is required for the GitHub tool created in your ServiceNow instance


For basic authentication , create secrets called 
- `SN_INSTANCE_URL` your ServiceNow instance URL, for example **https://test.service-now.com**
- `SN_DEVOPS_USER`
- `SN_DEVOPS_PASSWORD`
- `SN_ORCHESTRATION_TOOL_ID` only the **sys_id** is required for the GitHub tool created in your ServiceNow instance

## Step 3: Identify upstream job that must complete successfully before the job using this custom action will run
Use needs to configure the identified upstream job. See [test.yml](.github/workflows/test.yml) for usage.

## Step 4: Configure the GitHub Action if need to adapt for your needs or workflows

# For Token based Authentication which is available from v1.39.0 at ServiceNow instance
```yaml
deploy:
    name: Deploy
    needs: <upstream job>
    runs-on: ubuntu-latest
    steps:     
      - name: ServiceNow DevOps Security Results
        uses: ServiceNow/servicenow-devops-security-result@main
        with:
          devops-integration-token: ${{ secrets.SN_DEVOPS_INTEGRATION_TOKEN }}
          instance-url: ${{ secrets.SN_INSTANCE_URL }}
          tool-id: ${{ secrets.SN_ORCHESTRATION_TOOL_ID }}
          context-github: ${{ toJSON(github) }}
          job-name: 'Deploy'
          security-result-attributes:  '{"scanner":"Veracode","applicationName":"azure","buildVersion":"jenkins-Veracode with Step-27"}'
```
# For Basic Authentication at ServiceNow instance
```yaml
deploy:
    name: Deploy
    needs: <upstream job>
    runs-on: ubuntu-latest
    steps:     
      - name: ServiceNow DevOps Security Results
        uses: ServiceNow/servicenow-devops-security-result@main
        with:
          devops-integration-user-name: ${{ secrets.SN_DEVOPS_USER }}
          devops-integration-user-password: ${{ secrets.SN_DEVOPS_PASSWORD }}
          instance-url: ${{ secrets.SN_INSTANCE_URL }}
          tool-id: ${{ secrets.SN_ORCHESTRATION_TOOL_ID }}
          context-github: ${{ toJSON(github) }}
          job-name: 'Deploy'
          security-result-attributes:  '{"scanner":"Veracode","applicationName":"azure","buildVersion":"jenkins-Veracode with Step-27"}'
```
The values for secrets should be setup in Step 1. Secrets should be created in Step 2.

## Inputs

### `devops-integration-token`

**Optional**  DevOps Integration Token of GitHub tool created in ServiceNow instance for token based authentication.

### `devops-integration-user-name`

**Optional**  DevOps Integration Username to ServiceNow instance. 

### `devops-integration-user-password`

**Optional**  DevOps Integration User Password to ServiceNow instance.

### `instance-url`

**Required**  URL of ServiceNow instance to create change in ServiceNow. 

### `tool-id`

**Required**  Orchestration Tool Id for GitHub created in ServiceNow DevOps

### `context-github`

**Required**  Github context contains information about the workflow run details.

### `security-result-attributes`

**Required**  Security Result Attributes

  ```
  {
  applicationName: # Name of your Veracode application and is required. This attribute is applicable only for Veracode.

  scanner:  # Scanning tool and is required e.g. Veracode.

  buildVersion: # Veracode Scan name / build version and is optional. This attribute is applicable only for Veracode.

  securityToolId: # Security tool onboarded in ServiceNow (sys_id of the onboarded security tool) and is optional.
  }
  ```

## Outputs
No outputs produced.

# Notices

## Support Model

ServiceNow customers may request support through the [Now Support (HI) portal](https://support.servicenow.com/nav_to.do?uri=%2Fnow_support_home.do).

## Governance Model

Initially, ServiceNow product management and engineering representatives will own governance of these integrations to ensure consistency with roadmap direction. In the longer term, we hope that contributors from customers and our community developers will help to guide prioritization and maintenance of these integrations. At that point, this governance model can be updated to reflect a broader pool of contributors and maintainers. 
