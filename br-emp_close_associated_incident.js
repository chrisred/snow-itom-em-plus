(function executeRule(current, previous /*null when async*/)
{
    var alertManager = new SNC.AlertManager();
    alertManager.addStep('Alert BR: Close associated incident (after)');

    var taskRecord = new GlideRecord('task');
    taskRecord.get(current.incident);

    try
    {
        var additionalInfo = JSON.parse(current.additional_info);        
    }
    catch (err)
    {
        gs.error('EMP - Unable to parse "additional_info" field for {0}.', current.number);
    }

    // Only handle incident tasks. Lines 30-49 in the OOB script appear to choose a state for task types other than
    // "incident". We only care about linked incident tasks so that block was not used here.
    if (taskRecord.sys_class_name == 'incident')
    {
        if (taskRecord.state != IncidentState.RESOLVED && taskRecord.state != IncidentState.CLOSED &&
            taskRecord.state != IncidentState.CANCELED)
        {
            // check there are no alerts linked to this task that are not closed
            var relatedAlerts = new GlideRecord('em_alert');
            relatedAlerts.addQuery('sys_id', '!=', current.sys_id); // skip the current alert
            relatedAlerts.addQuery('state', '!=', 'closed');
            relatedAlerts.addQuery('severity', '!=', '5');
            relatedAlerts.addQuery('severity', '!=', '0');
            relatedAlerts.addQuery('incident', current.incident);
            relatedAlerts.query();

            if (relatedAlerts.getRowCount() == 0)
            {
                var behaviour;
                if (additionalInfo.override_alert_closes_incident !== undefined)
                {
                    behaviour = additionalInfo.override_alert_closes_incident;
                }
                else
                {
                    behaviour = gs.getProperty('evt_mgmt.alert_closes_incident');
                }

                if (behaviour == 'close' || behaviour == 'resolve')
                {
                    var closeCode;
                    if (additionalInfo.override_alert_incident_close_code !== undefined)
                    {
                        closeCode = additionalInfo.override_alert_incident_close_code;
                    }
                    else
                    {
                        closeCode = gs.getProperty('evt_mgmt.alert_incident_close_code');
                    }

                    var closeNotes;
                    if (additionalInfo.override_alert_incident_close_notes !== undefined)
                    {
                        closeNotes = additionalInfo.override_alert_incident_close_notes;
                    }
                    else
                    {
                        closeNotes = gs.getProperty('evt_mgmt.alert_incident_close_notes');
                    }

                    var incidentRecord = new GlideRecord('incident');
                    incidentRecord.get(taskRecord.getUniqueValue());
                    incidentRecord.close_code = gs.getMessage(closeCode);
                    incidentRecord.close_notes = gs.getMessage(closeNotes, current.number);
                    incidentRecord.state = (behaviour == 'resolve' ? IncidentState.RESOLVED : IncidentState.CLOSED);

                    // removed an OOB block which updated the "asset action" when Hardware Asset Management (HAM) is enabled

                    incidentRecord.update();
                }
                else if (behaviour == 'nothing')
                {
                    // do nothing
                }
                else
                {
                    gs.error(
                        'EMP - Unable to update {0} linked to {1}, the System Property "evt_mgmt.alert_closes_incident" ' +
                        'or the Event Rule manual attribute "override_alert_closes_incident" are not set correctly.',
                        taskRecord.number, current.number
                    );
                }
            }
        }
    }
    else
    {
        gs.error('EMP - Unable to update {0} linked to {1}, unexpected task type ({2}).',
            taskRecord.number, current.number, taskRecord.sys_class_name);
    }
})(current, previous);
