import express from 'express';
import { Logger } from '../../../common/logger';
import { ApiError } from '../../../common/api.error';
import { ResponseHandler } from '../../../common/response.handler';
import { uuid } from '../../../domain.types/miscellaneous/system.types';
import { PersonDomainModel } from '../../../domain.types/person/person.domain.model';
import { UserDomainModel } from '../../../domain.types/user/user/user.domain.model';
import { HealthProfileService } from '../../../services/patient/health.profile.service';
import { PatientService } from '../../../services/patient/patient.service';
import { Loader } from '../../../startup/loader';
import { PatientValidator } from '../../validators/patient/patient.validator';
import { BaseUserController } from '../base.user.controller';
import { UserHelper } from '../../helpers/user.helper';
import { UserDeviceDetailsService } from '../../../services/user/user.device.details.service';
import { PersonService } from '../../../services/person.service';
import { UserService } from '../../../services/user/user.service';
import { PatientDetailsDto } from '../../../domain.types/patient/patient/patient.dto';
import { ConfigurationManager } from '../../../config/configuration.manager';
import { CustomTaskHelper } from '../../helpers/custom.task.helper';
import { CustomTaskDomainModel } from '../../../domain.types/user/custom.task/custom.task.domain.model';
import { UserActionType, UserTaskCategory } from '../../../domain.types/user/user.task/user.task.types';
import { AssessmentTemplateService } from '../../../services/clinical/assessment/assessment.template.service';
import { AssessmentDomainModel } from '../../../domain.types/clinical/assessment/assessment.domain.model';
import { UserTaskDomainModel } from '../../../domain.types/user/user.task/user.task.domain.model';
import { AssessmentService } from '../../../services/clinical/assessment/assessment.service';
import { UserTaskService } from '../../../services/user/user.task.service';

///////////////////////////////////////////////////////////////////////////////////////

export class PatientController extends BaseUserController {

    //#region member variables and constructors

    _service: PatientService = null;

    _userService: UserService = null;

    _patientHealthProfileService: HealthProfileService = null;

    _personService: PersonService = null;

    _userDeviceDetailsService: UserDeviceDetailsService = null;

    _assessmentTemplateService: AssessmentTemplateService = null;

    _assessmentService: AssessmentService = null;

    _userTaskService: UserTaskService = null;

    _userHelper: UserHelper = new UserHelper();
    
    _customTaskHelper: CustomTaskHelper = new CustomTaskHelper();

    _validator = new PatientValidator();

    constructor() {
        super();
        this._service = Loader.container.resolve(PatientService);
        this._userService = Loader.container.resolve(UserService);
        this._personService = Loader.container.resolve(PersonService);
        this._userDeviceDetailsService = Loader.container.resolve(UserDeviceDetailsService);
        this._assessmentTemplateService = Loader.container.resolve(AssessmentTemplateService);
        this._assessmentService = Loader.container.resolve(AssessmentService);
        this._userTaskService = Loader.container.resolve(UserTaskService);
        this._patientHealthProfileService = Loader.container.resolve(HealthProfileService);
    }

    //#endregion

    //#region Action methods

    create = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            await this.setContext('Patient.Create', request, response, false);

            const createModel = await this._validator.create(request);
            const [ patient, createdNew ] = await this._userHelper.createPatient(createModel);

            //await this.performCustomActions(patient);

            //const actionIdKCCQ = await this.createInitialAssessmentTask(patient.UserId, 'KCCQ');
            //Logger.instance().log(`Action id for KCCQ is ${actionIdKCCQ}`);

            if (createdNew) {
                ResponseHandler.success(request, response, 'Patient created successfully!', 201, {
                    Patient : patient,
                });
                return;
            }
            ResponseHandler.failure(request, response, `Patient account already exists!`, 409);
        } catch (error) {

            //KK: Todo: Add rollback in case of mid-way exception
            ResponseHandler.handleError(request, response, error);
        }
    };

    getByUserId = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            await this.setContext('Patient.GetByUserId', request, response);

            const userId: uuid = await this._validator.getParamUuid(request, 'userId');
            const existingUser = await this._userService.getById(userId);
            if (existingUser == null) {
                throw new ApiError(404, 'User not found.');
            }

            const patient = await this._service.getByUserId(userId);

            Logger.instance().log(`Patient: ${JSON.stringify(patient)}`);

            if (patient == null) {
                throw new ApiError(404, 'Patient not found.');
            }

            ResponseHandler.success(request, response, 'Patient retrieved successfully!', 200, {
                Patient : patient,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    search = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            await this.setContext('Patient.Search', request, response, false);

            const filters = await this._validator.search(request);
            const searchResults = await this._service.search(filters);
            const count = searchResults.Items.length;
            const message =
                count === 0 ? 'No records found!' : `Total ${count} patient records retrieved successfully!`;
                
            ResponseHandler.success(request, response, message, 200, {
                Patients : searchResults,
            });

        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    updateByUserId = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            await this.setContext('Patient.UpdateByUserId', request, response);

            const userId: uuid = await this._validator.getParamUuid(request, 'userId');
            const existingUser = await this._userService.getById(userId);
            if (existingUser == null) {
                throw new ApiError(404, 'User not found.');
            }

            const updateModel = await this._validator.updateByUserId(request);
            const userDomainModel: UserDomainModel = updateModel.User;
            const updatedUser = await this._userService.update(userId, userDomainModel);
            if (!updatedUser) {
                throw new ApiError(400, 'Unable to update user!');
            }
            const personDomainModel: PersonDomainModel = updateModel.User.Person;
            personDomainModel.id = updatedUser.Person.id;
            const updatedPerson = await this._personService.update(existingUser.Person.id, personDomainModel);
            if (!updatedPerson) {
                throw new ApiError(400, 'Unable to update person!');
            }
            const updatedPatient = await this._service.updateByUserId(
                updatedUser.id,
                updateModel
            );
            if (updatedPatient == null) {
                throw new ApiError(400, 'Unable to update patient record!');
            }

            await this.createOrUpdateDefaultAddress(request, existingUser.Person.id);

            const patient = await this._service.getByUserId(userId);

            ResponseHandler.success(request, response, 'Patient records updated successfully!', 200, {
                Patient : patient,
            });
            
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    deleteByUserId = async (request: express.Request, response: express.Response): Promise<void> => {
        try {
            await this.setContext('Patient.DeleteByUserId', request, response);

            const userId: uuid = await this._validator.getParamUuid(request, 'userId');
            const currentUserId = request.currentUser.UserId;
            const patientUserId = userId;
            const patient = await this._service.getByUserId(userId);
            if (!patient) {
                throw new ApiError(404, 'Patient account does not exist!');
            }
            const personId = patient.User.PersonId;
            if (currentUserId !== patientUserId) {
                throw new ApiError(403, 'You do not have permissions to delete this patient account.');
            }
            const existingUser = await this._userService.getById(userId);
            if (existingUser == null) {
                throw new ApiError(404, 'User not found.');
            }
            var deleted = await this._userDeviceDetailsService.deleteByUserId(userId);
            if (!deleted) {
                throw new ApiError(400, 'User cannot be deleted.');
            }
            deleted = await this._patientHealthProfileService.deleteByPatientUserId(userId);
            if (!deleted) {
                throw new ApiError(400, 'User cannot be deleted.');
            }
            deleted = await this._userService.delete(userId);
            if (!deleted) {
                throw new ApiError(400, 'User cannot be deleted.');
            }
            deleted = await this._service.deleteByUserId(userId);
            if (!deleted) {
                throw new ApiError(400, 'User cannot be deleted.');
            }
            //TODO: Please add check here whether the patient-person
            //has other roles in the system
            deleted = await this._personService.delete(personId);
            if (!deleted) {
                throw new ApiError(400, 'User cannot be deleted.');
            }
            ResponseHandler.success(request, response, 'Patient records deleted successfully!', 200, {
                Deleted : true,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    ///////////////////////////////////////////////////////////////
    //TODO: Move this method to separate customization module later
    ///////////////////////////////////////////////////////////////

    performCustomActions = async (patient: PatientDetailsDto) => {

        const systemIdentifier = ConfigurationManager.SystemIdentifier();

        const shouldAddSurveyTask = systemIdentifier.includes('AHA') ||
            process.env.NODE_ENV === 'development' ||
            process.env.NODE_ENV === 'uat';

        if (shouldAddSurveyTask) {

            //Add AHA specific tasks, events and handlers here...
            const userId = patient.User.id;

            //Adding survey task for AHA patients
            const domainModel: CustomTaskDomainModel = {
                UserId      : userId,
                Task        : "Survey",
                Description : "Take a survey to help us understand you better!",
                Category    : UserTaskCategory.Custom,
                Details     : {
                    Link : "https://americanheart.co1.qualtrics.com/jfe/form/SV_b1anZr9DUmEOsce",
                },
                ScheduledStartTime : new Date(),
            };

            const task = await this._customTaskHelper.createCustomTask(domainModel);
            if (task == null) {
                Logger.instance().log('Unable to create AHA survey task!');
            }
        }
    }

    private createInitialAssessmentTask = async (
        patientUserId: string,
        templateName: string): Promise<any> => {

        const template = await this._assessmentTemplateService.search({ Title: templateName });
        const templateId: string = template.Items[0].id;
        const assessmentBody : AssessmentDomainModel = {
            PatientUserId        : patientUserId,
            Title                : template.Items[0].Title,
            Type                 : template.Items[0].Type,
            AssessmentTemplateId : templateId,
            ScheduledDateString  : new Date().toISOString().split('T')[0]
        };

        const assessment = await this._assessmentService.create(assessmentBody);
        const assessmentId = assessment.id;

        const userTaskBody : UserTaskDomainModel = {
            UserId             : patientUserId,
            Task               : templateName,
            Category           : UserTaskCategory.Assessment,
            ActionType         : UserActionType.Careplan,
            ActionId           : assessmentId,
            ScheduledStartTime : new Date(),
            IsRecurrent        : false
        };

        const userTask = await this._userTaskService.create(userTaskBody);

        return userTask.ActionId;
    }
    //#endregion

}
