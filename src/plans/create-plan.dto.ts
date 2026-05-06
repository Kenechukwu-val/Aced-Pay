import { IsIn, IsNumber, IsString, Min } from 'class-validator';


export class CreatePlanDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;
    
    @IsIn(['month', 'year'])
    interval: 'month' | 'year';
}
