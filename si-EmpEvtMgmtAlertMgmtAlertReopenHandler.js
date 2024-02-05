gs.include('EvtMgmtAlertMgmtAlertReopenHandler');

var EmpEvtMgmtAlertMgmtAlertReopenHandler = Class.create();
EmpEvtMgmtAlertMgmtAlertReopenHandler.prototype = Object.extendsObject(EvtMgmtAlertMgmtAlertReopenHandler, {

    onAlertReopen: function(current)
    {
        try
        {
            var additionalInfo = JSON.parse(current.additional_info);        
        }
        catch (err)
        {
            gs.error('EMP - Unable to parse "additional_info" field for {0}.', current.number);
        }

        var alertNumber = current.number;
        var task = new GlideRecord('task');
        task.get(current.incident);

        // Only handle incident tasks. Lines 28-52 in the OOB script appear to choose a state for task types other than
        // "incident". We only care about linked incident tasks so that block was not used here.
        if (task.sys_class_name == 'incident')
        {
            var taskNumber = task.number;
            var taskState = task.state;

            if (taskState == global.IncidentState.RESOLVED || taskState == global.IncidentState.CLOSED)
            {
                var behaviour;
                if (additionalInfo.override_alert_reopens_incident !== undefined)
                {
                    // use the "override" manual attribute configured in an Event Rule
                    behaviour = additionalInfo.override_alert_reopens_incident;
                }
                else
                {
                    behaviour = gs.getProperty('evt_mgmt.alert_reopens_incident');
                }

                var manualIncident = this.incidentCreatedManually(task);

                if (behaviour == 'reopen')
                {
                    this.handleReopen(current, alertNumber, manualIncident, taskNumber, task);
                }
                else if (behaviour == 'new')
                {
                    this.handleNew(current, alertNumber, manualIncident, task.sys_class_name, task, taskNumber);
                }
                else if (behaviour == 'nothing')
                {
                    // do nothing
                }
            }
            else
            {
                // incident is still open, just add a comment to it
                this.updateWorkNoteField(task, gs.getMessage('The related alert {0} state is now {1}', [alertNumber, current.state]));
                task.update();
            }
        }
        else
        {
            gs.error('EMP - Unable to update {0} linked to {1}, unexpected task type ({2}).',
                task.number, current.number, task.sys_class_name);
        }
    },

    reopen: function(current, taskNumber, task)
    {
        try
        {
            var additionalInfo = JSON.parse(current.additional_info);        
        }
        catch (err)
        {
            gs.error('EMP - Unable to parse "additional_info" field for {0}.', current.number);
        }

        var incidentState;
        if (additionalInfo.override_alert_reopens_incident_state !== undefined)
        {
            // use the "override" manual attribute configured in an Event Rule
            incidentState = additionalInfo.override_alert_reopens_incident_state;
        }
        else
        {
            incidentState = gs.getProperty('evt_mgmt.alert_reopens_incident_state');
        }

        switch (incidentState)
        {
            case 'new':
                task.state = global.IncidentState.NEW;
                break;
            case 'in_progress':
                task.state = global.IncidentState.IN_PROGRESS;
                break;
            case 'on_hold':
                task.state = global.IncidentState.ON_HOLD;
                break;
            default:
                task.state = global.IncidentState.NEW;
                gs.error(
                    'EMP - Default state used for {0} linked to {1}, the System Property "evt_mgmt.alert_reopens_incident_state" ' +
                    'or the Event Rule manual attribute "override_alert_reopens_incident_state" are not set correctly.',
                    task.number, current.number
                );
        }

        this.updateWorkNoteField(task, gs.getMessage("The related alert {0} state is now {1}", [current.number, current.state]));
        task.update();
    },

    type: 'EmpEvtMgmtAlertMgmtAlertReopenHandler'
});