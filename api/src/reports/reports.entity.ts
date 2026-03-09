import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('reports')
export class ReportEntity {
  @PrimaryColumn()
  reportId!: string;

  @Column()
  companyId!: string;

  @Column()
  reportHash!: string;

  @Column('text')
  canonicalJson!: string;

  @Column()
  periodStart!: string;

  @Column()
  periodEnd!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
