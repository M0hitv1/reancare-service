import { inject, injectable } from "tsyringe";
import { IThirdpartyApiRepo } from "../../database/repository.interfaces/thirdparty/thirdparty.api.repo.interface";
import { ThirdpartyApiCredentialsDomainModel, ThirdpartyApiCredentialsDto } from '../../domain.types/thirdparty/thirdparty.api.credentials';
import { uuid } from "../../domain.types/miscellaneous/system.types";

////////////////////////////////////////////////////////////////////////////////////////////////////////

@injectable()
export class ThirdpartyApiService {

    constructor(
        @inject('IThirdpartyApiepo') private _thirdpartyApiRepo: IThirdpartyApiRepo,
    ) {}

    getThirdpartyCredentials = async (userId: uuid, provider: string, baseUrl: string)
        : Promise<ThirdpartyApiCredentialsDto> => {
        return await this._thirdpartyApiRepo.getThirdpartyCredentials(userId, provider, baseUrl);
    };

    addThirdpartyCredentials = async (userId: uuid, connectionModel: ThirdpartyApiCredentialsDomainModel)
        : Promise<ThirdpartyApiCredentialsDto> => {
        return await this._thirdpartyApiRepo.addThirdpartyCredentials(userId, connectionModel);
    };

}
