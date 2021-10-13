export interface BloodGlucoseDomainModel {
    id?: string;
    EhrId?: string;
    PatientUserId?: string;
    BloodGlucose: number;
    Unit: string;
    RecordDate?: Date;
    RecordedByUserId?: string;
}
