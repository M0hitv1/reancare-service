import { IBloodOxygenSaturationRepo } from '../../../../repository.interfaces/biometrics/blood.oxygen.saturation.repo.interface';
import BloodOxygenSaturationModel from '../../models/biometrics/blood.oxygen.saturation.model';
import { Op } from 'sequelize';
import { BloodOxygenSaturationMapper } from '../../mappers/biometrics/blood.oxygen.saturation.mapper';
import { Logger } from '../../../../../common/logger';
import { ApiError } from '../../../../../common/api.error';
import { BloodOxygenSaturationDomainModel } from "../../../../../domain.types/biometrics/blood.oxygen.saturation/blood.oxygen.saturation.domain.model";
import { BloodOxygenSaturationDto } from "../../../../../domain.types/biometrics/blood.oxygen.saturation/blood.oxygen.saturation.dto";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BloodOxygenSaturationSearchFilters, BloodOxygenSaturationSearchResults } from "../../../../../domain.types/biometrics/blood.oxygen.saturation/blood.oxygen.saturation.search.types";

///////////////////////////////////////////////////////////////////////

export class BloodOxygenSaturationRepo implements IBloodOxygenSaturationRepo {

    create = async (bloodOxygenSaturationDomainModel: BloodOxygenSaturationDomainModel):
    Promise<BloodOxygenSaturationDto> => {
        try {
            const entity = {
                PatientUserId         : bloodOxygenSaturationDomainModel.PatientUserId,
                BloodOxygenSaturation : bloodOxygenSaturationDomainModel.BloodOxygenSaturation,
                Unit                  : bloodOxygenSaturationDomainModel.Unit,
                RecordDate            : bloodOxygenSaturationDomainModel.RecordDate,
                RecordedByUserId      : bloodOxygenSaturationDomainModel.RecordedByUserId
            };

            const bloodOxygenSaturation = await BloodOxygenSaturationModel.create(entity);
            const dto = await BloodOxygenSaturationMapper.toDto(bloodOxygenSaturation);
            return dto;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    getById = async (id: string): Promise<BloodOxygenSaturationDto> => {
        try {
            const bloodOxygenSaturation = await BloodOxygenSaturationModel.findByPk(id);
            const dto = await BloodOxygenSaturationMapper.toDto(bloodOxygenSaturation);
            return dto;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    search = async (filters: BloodOxygenSaturationSearchFilters): Promise<BloodOxygenSaturationSearchResults> => {
        try {
            const search = { where: {} };

            if (filters.PatientUserId != null) {
                search.where['PatientUserId'] = filters.PatientUserId;
            }
            if (filters.MinValue != null && filters.MaxValue != null) {
                search.where['BloodOxygenSaturation'] = {
                    [Op.gte] : filters.MinValue,
                    [Op.lte] : filters.MaxValue,
                };
            } else if (filters.MinValue === null && filters.MaxValue !== null) {
                search.where['BloodOxygenSaturation'] = {
                    [Op.lte] : filters.MaxValue,
                };
            } else if (filters.MinValue !== null && filters.MaxValue === null) {
                search.where['BloodOxygenSaturation'] = {
                    [Op.gte] : filters.MinValue,
                };
            }
            if (filters.CreatedDateFrom != null && filters.CreatedDateTo != null) {
                search.where['CreatedAt'] = {
                    [Op.gte] : filters.CreatedDateFrom,
                    [Op.lte] : filters.CreatedDateTo,
                };
            } else if (filters.CreatedDateFrom === null && filters.CreatedDateTo !== null) {
                search.where['CreatedAt'] = {
                    [Op.lte] : filters.CreatedDateTo,
                };
            } else if (filters.CreatedDateFrom !== null && filters.CreatedDateTo === null) {
                search.where['CreatedAt'] = {
                    [Op.gte] : filters.CreatedDateFrom,
                };
            }
            if (filters.RecordedByUserId !== null) {
                search.where['RecordedByUserId'] = filters.RecordedByUserId;
            }

            let orderByColum = 'CreatedAt';
            if (filters.OrderBy) {
                orderByColum = filters.OrderBy;
            }
            let order = 'ASC';
            if (filters.Order === 'descending') {
                order = 'DESC';
            }
            search['order'] = [[orderByColum, order]];

            let limit = 25;
            if (filters.ItemsPerPage) {
                limit = filters.ItemsPerPage;
            }
            let offset = 0;
            let pageIndex = 0;
            if (filters.PageIndex) {
                pageIndex = filters.PageIndex < 0 ? 0 : filters.PageIndex;
                offset = pageIndex * limit;
            }
            search['limit'] = limit;
            search['offset'] = offset;

            const foundResults = await BloodOxygenSaturationModel.findAndCountAll(search);

            const dtos: BloodOxygenSaturationDto[] = [];
            for (const bloodOxygenSaturation of foundResults.rows) {
                const dto = await BloodOxygenSaturationMapper.toDto(bloodOxygenSaturation);
                dtos.push(dto);
            }

            const searchResults: BloodOxygenSaturationSearchResults = {
                TotalCount     : foundResults.count,
                RetrievedCount : dtos.length,
                PageIndex      : pageIndex,
                ItemsPerPage   : limit,
                Order          : order === 'DESC' ? 'descending' : 'ascending',
                OrderedBy      : orderByColum,
                Items          : dtos,
            };

            return searchResults;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    update = async (id: string, bloodOxygenSaturationDomainModel: BloodOxygenSaturationDomainModel):
    Promise<BloodOxygenSaturationDto> => {
        try {
            const bloodOxygenSaturation = await BloodOxygenSaturationModel.findByPk(id);

            if (bloodOxygenSaturationDomainModel.PatientUserId != null) {
                bloodOxygenSaturation.PatientUserId = bloodOxygenSaturationDomainModel.PatientUserId;
            }
            if (bloodOxygenSaturationDomainModel.BloodOxygenSaturation != null) {
                bloodOxygenSaturation.BloodOxygenSaturation = bloodOxygenSaturationDomainModel.BloodOxygenSaturation;
            }
            if (bloodOxygenSaturationDomainModel.Unit != null) {
                bloodOxygenSaturation.Unit = bloodOxygenSaturationDomainModel.Unit;
            }
            if (bloodOxygenSaturationDomainModel.RecordDate != null) {
                bloodOxygenSaturation.RecordDate = bloodOxygenSaturationDomainModel.RecordDate;
            }
            if (bloodOxygenSaturationDomainModel.RecordedByUserId != null) {
                bloodOxygenSaturation.RecordedByUserId = bloodOxygenSaturationDomainModel.RecordedByUserId;
            }
    
            await bloodOxygenSaturation.save();

            const dto = await BloodOxygenSaturationMapper.toDto(bloodOxygenSaturation);
            return dto;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

    delete = async (id: string): Promise<boolean> => {
        try {
            Logger.instance().log(id);

            await BloodOxygenSaturationModel.destroy({ where: { id: id } });
            return true;
        } catch (error) {
            Logger.instance().log(error.message);
            throw new ApiError(500, error.message);
        }
    };

}
