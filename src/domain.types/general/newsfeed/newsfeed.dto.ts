import { uuid } from "../../miscellaneous/system.types";

export interface NewsfeedDto{
    id?            : uuid;
    UserId?        : uuid;
    Title?         : string;
    Body?          : string;
    Payload?       : string;
    ImageUrl?      : string;
    Type?          : string;
    SentOn?        : Date;
    ReadOn?        : Date;
}
