import { ProgressReportService } from '../ProgressReportService';

const userId = 'patient-1';
const reportRange = {
  startDate: '2026-04-01',
  endDate: '2026-04-30',
};

const medEntries = [
  {
    medEntryId: 'med-1',
    medName: 'Vitamin C',
    dosage: '500mg',
    amount: 1,
    quantityUnit: 'tablet',
    dailySched: ['08:00', '20:00'],
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    isTaken: true,
    timeTaken: '08:00',
    dateTaken: '2026-04-20',
    timesTaken: ['08:00'],
  },
  {
    medEntryId: 'med-2',
    medName: 'Calcium',
    dosage: '250mg',
    amount: 1,
    quantityUnit: 'tablet',
    dailySched: ['12:00'],
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    isTaken: false,
    timeTaken: null,
    dateTaken: null,
    timesTaken: [],
  },
];

const apptEntries = [
  {
    apptEntryId: 'appt-1',
    concern: 'Checkup',
    address: 'Main Clinic',
    contactNumber: '09123456789',
    timeSched: '09:00',
    dateSched: '2026-04-20',
    note: 'Bring results',
    isCompleted: true,
    completedAt: '2026-04-20T10:00:00.000Z',
  },
  {
    apptEntryId: 'appt-2',
    concern: 'Follow-up',
    address: 'Main Clinic',
    contactNumber: '09123456789',
    timeSched: '14:00',
    dateSched: '2026-04-24',
    note: 'Discuss medication',
    isCompleted: false,
  },
];

const createService = () =>
  new ProgressReportService({
    initialMedEntriesByUserId: { [userId]: medEntries },
    initialApptEntriesByUserId: { [userId]: apptEntries },
  });

describe('ProgressReportService', () => {
  it('generates a report snapshot with medication and appointment stats', () => {
    const service = createService();

    const snapshot = service.generateReport(userId, reportRange);

    expect(snapshot.title).toBe('Progress Report');
    expect(snapshot.subtitle).toContain('2026');
    expect(snapshot.medicationStats.totalMedEntries).toBe(2);
    expect(snapshot.appointmentStats.totalAppointments).toBe(2);
    expect(snapshot.medEntries).toHaveLength(2);
    expect(snapshot.apptEntries).toHaveLength(2);
  });

  it('returns summary and report sections', () => {
    const service = createService();

    const summary = service.getReportSummary(userId, reportRange);
    const medSection = service.getMedicationReportSection(userId, reportRange);
    const apptSection = service.getAppointmentReportSection(userId, reportRange);

    expect(summary.summary).toContain('Medication');
    expect(medSection.title).toBe('Medication Summary');
    expect(medSection.entries).toHaveLength(2);
    expect(apptSection.title).toBe('Appointment Summary');
    expect(apptSection.entries).toHaveLength(2);
  });

  it('exports report in object, json, and csv formats', () => {
    const service = createService();

    const objectExport = service.exportReport(userId, reportRange, 'object');
    const jsonExport = service.exportReport(userId, reportRange, 'json');
    const csvExport = service.exportReport(userId, reportRange, 'csv');

    expect(objectExport.generatedAt).toEqual(expect.any(String));
    expect(JSON.parse(jsonExport).reportId).toEqual(expect.any(String));
    expect(csvExport).toContain('section,key,value');
    expect(csvExport).toContain('medicationStats,totalMedEntries');
  });

  it('wraps required ProgressReport model methods', () => {
    const service = createService();
    service.generateReport(userId, reportRange);

    expect(service.updateTitle(userId, 'My Progress')).toBe('My Progress');
    expect(service.updateSubtitle(userId, 'April 2026')).toBe('April 2026');
    expect(service.updateSummary(userId, 'Summary text')).toBe('Summary text');
    expect(service.updateDetails(userId, 'Details text')).toBe('Details text');

    const updatedRange = service.updateDateRange(userId, '2026-04-10', '2026-04-30');
    expect(updatedRange.startDate.toISOString().slice(0, 10)).toBe('2026-04-10');
    expect(updatedRange.endDate.toISOString().slice(0, 10)).toBe('2026-04-30');

    const updatedGeneratedAt = service.updateGeneratedAt(userId, '2026-04-21T12:00:00Z');
    expect(updatedGeneratedAt).toEqual(expect.any(Date));

    expect(service.setMedEntries(userId, [medEntries[0]])).toHaveLength(1);
    expect(service.setApptEntries(userId, [apptEntries[0]])).toHaveLength(1);
    expect(service.addMedEntry(userId, medEntries[1])).toHaveLength(2);
    expect(service.addApptEntry(userId, apptEntries[1])).toHaveLength(2);

    const dateRange = service.getDateRange(userId);
    expect(dateRange.startDate).toEqual(expect.any(Date));
    expect(dateRange.endDate).toEqual(expect.any(Date));
    expect(service.isWithinReportRange(userId, '2026-04-15')).toBe(true);

    const medEntriesInRange = service.getMedEntriesInRange(userId);
    const apptEntriesInRange = service.getApptEntriesInRange(userId);
    expect(medEntriesInRange).toHaveLength(2);
    expect(apptEntriesInRange).toHaveLength(2);

    const medicationStats = service.getMedicationStats(userId);
    const appointmentStats = service.getAppointmentStats(userId);
    expect(medicationStats).toHaveProperty('adherenceRate');
    expect(appointmentStats).toHaveProperty('completedAppointments');

    const snapshot = service.getReportSnapshot(userId);
    expect(snapshot.title).toBe('My Progress');
    expect(snapshot.subtitle).toBe('April 2026');
    expect(snapshot.summary).toBe('Summary text');
    expect(snapshot.details).toBe('Details text');
  });
});
