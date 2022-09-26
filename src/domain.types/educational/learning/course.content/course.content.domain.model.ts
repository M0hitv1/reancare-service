import { uuid } from "../../../miscellaneous/system.types";

export interface CourseContentDomainModel {
    id?             : uuid;
    LearningPathId? : uuid;
    CourseId?       : uuid;
    ModuleId?       : uuid;
    Title?          : string;
    Description?    : string;
    ImageUrl?       : string;
    DurationInMins? : number;
    ContentType?    : string;
    ResourceLink?   : string;
    Sequence?       : number;
}