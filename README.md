# ServiceNow Event Management Plus

Updates to the ServiceNow [Event Management](https://docs.servicenow.com/csh?topicname=c_EM.html&version=latest) plugin that allow more granular configuration for incident closure and reopen behaviour. The [Event Rules](https://docs.servicenow.com/csh?topicname=create-event-rules.html&version=latest) manual attribute option is used to pass a value which will override the global configuration. Global configuration is usually set via system properties or hard coded into a plugin.

## Setup

1. Ensure the following plugins are active as a minimum requirement.
* Event Management and Service Mapping Core (`com.snc.service-watch`).
* Event Management (`com.glideapp.itom.snac`).

2. Import the update set file [`event_management_plus.xml`](event_management_plus.xml) using the "Retrieved Update Sets" option within ServiceNow. The following records will be created:
* The system property `evt_mgmt.alert_reopens_incident_state` to allow the state of reopened incidents to be set.
* The business rule `EMP Close associated incident` which customises the close behaviour.
* The business rule and `EMP Reopen associated closed incident` which customises the reopen behaviour.
* The script include `EmpEvtMgmtAlertMgmtAlertReopenHandler` which customises the reopen handler functions used by the business rule.

3. Disable (uncheck "Active") the business rules `Close associated incident` and `Reopen associated closed incident`. This will disable the out-of-the-box behaviour.

4. Enable (check "Active") the business rules `EMP Close associated incident` and `EMP Reopen associated closed incident`. This will enable the custom behaviour.

## Usage

The following manual attributes can be added to an event rule to trigger the custom behaviour for alerts matching the rule.

| Attribute Name | Values | Description |
| --- | --- | --- |
| `override_alert_closes_incident` | `resolve`, `close`, `nothing` | Changes the incident close behaviour. |
| `override_alert_reopens_incident` | `new`, `reopen`, `nothing` | Changes the incident reopen behaviour. |
| `override_alert_reopens_incident_state` | `new`, `in_progress`, `on_hold`,  | Changes the incident reopen state behaviour. |

For example, navigate to `Event Management` > `Rules` > `Event Rules`. [Create or edit](https://docs.servicenow.com/csh?topicname=create-or-edit-event-rule.html&version=latest) a rule, under "Transform and Compose Alert Output" check the "Manual attributes" option. Set "`override_alert_closes_incident` is `nothing`" to stop incidents auto-closing for alerts matched by the rule.

## Update Details

Other notable changes to the out-of-the-box Event Management behaviour (further details in the script files).

* Only incident tasks are supported for the alert task type, code that handled other types was removed.
* Removed some code which updated the "asset action" when Hardware Asset Management (HAM) is enabled.
