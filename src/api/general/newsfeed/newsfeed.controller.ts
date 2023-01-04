import express from 'express';
import { uuid } from '../../../domain.types/miscellaneous/system.types';
import { ApiError } from '../../../common/api.error';
import { ResponseHandler } from '../../../common/response.handler';
import { NewsfeedService } from '../../../services/general/newsfeed.service';
import { Loader } from '../../../startup/loader';
import { NewsfeedValidator } from '../newsfeed/newsfeed.validator';
import { BaseController } from '../../base.controller';

///////////////////////////////////////////////////////////////////////////////////////

export class NewsfeedController extends BaseController {

    //#region member variables and constructors

    _service: NewsfeedService = null;

    _validator: NewsfeedValidator = new NewsfeedValidator();

    constructor() {
        super();
        this._service = Loader.container.resolve(NewsfeedService);
    }

    //#endregion

    //#region Action methods

    create = async (request: express.Request, response: express.Response): Promise<void> => {
        try {

            await this.setContext('Newsfeed.Create', request, response);

            const model = await this._validator.create(request);
            const newsfeed = await this._service.create(model);
            if (newsfeed == null) {
                throw new ApiError(400, 'Could not create a newsfeed!');
            }

            ResponseHandler.success(request, response, 'Newsfeed created successfully!', 201, {
                Newsfeed : newsfeed,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    getById = async (request: express.Request, response: express.Response): Promise<void> => {
        try {

            await this.setContext('Newsfeed.GetById', request, response);

            const id: uuid = await this._validator.getParamUuid(request, 'id');
            const newsfeed = await this._service.getById(id);
            if (newsfeed == null) {
                throw new ApiError(404, 'Newsfeed not found.');
            }

            ResponseHandler.success(request, response, 'Newsfeed retrieved successfully!', 200, {
                Newsfeed : newsfeed,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    markAsRead = async (request: express.Request, response: express.Response): Promise<void> => {
        try {

            await this.setContext('Newsfeed.MarkAsRead', request, response);

            const domainModel = await this._validator.markAsRead(request);
            const id: uuid = await this._validator.getParamUuid(request, 'id');
            const existingRecord = await this._service.getById(id);
            if (existingRecord == null) {
                throw new ApiError(404, 'Newsfeed not found.');
            }

            const updated = await this._service.markAsRead(domainModel.id, domainModel);
            if (updated == null) {
                throw new ApiError(400, 'Unable to update a newsfeed!');
            }

            ResponseHandler.success(request, response, 'Newsfeed updated successfully!', 200, {
                Newsfeed : updated,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    search = async (request: express.Request, response: express.Response): Promise<void> => {
        try {

            await this.setContext('Newsfeed.Search', request, response);
            const filters = await this._validator.search(request);
            const searchResults = await this._service.search(filters);

            const count = searchResults.Items.length;

            const message =
                count === 0
                    ? 'No records found!'
                    : `Total ${count} newsfeeds retrieved successfully!`;

            ResponseHandler.success(request, response, message, 200, {
                NewsfeedRecords : searchResults });

        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    update = async (request: express.Request, response: express.Response): Promise<void> => {
        try {

            await this.setContext('Newsfeed.Update', request, response);

            const domainModel = await this._validator.update(request);
            const id: uuid = await this._validator.getParamUuid(request, 'id');
            const existingRecord = await this._service.getById(id);
            if (existingRecord == null) {
                throw new ApiError(404, 'Newsfeed not found.');
            }

            const updated = await this._service.update(domainModel.id, domainModel);
            if (updated == null) {
                throw new ApiError(400, 'Unable to update a newsfeed!');
            }

            ResponseHandler.success(request, response, 'Newsfeed updated successfully!', 200, {
                Newsfeed : updated,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

    delete = async (request: express.Request, response: express.Response): Promise<void> => {
        try {

            await this.setContext('Newsfeed.Delete', request, response);

            const id: uuid = await this._validator.getParamUuid(request, 'id');
            const existingRecord = await this._service.getById(id);
            if (existingRecord == null) {
                throw new ApiError(404, 'Newsfeed record not found.');
            }

            const deleted = await this._service.delete(id);
            if (!deleted) {
                throw new ApiError(400, 'Newsfeed can not be deleted.');
            }

            ResponseHandler.success(request, response, 'Newsfeed deleted successfully!', 200, {
                Deleted : true,
            });
        } catch (error) {
            ResponseHandler.handleError(request, response, error);
        }
    };

}
