import { Resident, Trainer, CheckInRecord, Role, User, TrainingLimitation, SystemUser } from './types';
import { addDays, subDays, subYears, format, parseISO } from 'date-fns';

const USERS_KEY = 'gym_users_credentials';
const RESIDENTS_KEY = 'gym_residents';
const TRAINERS_KEY = 'gym_trainers';
const CHECKINS_KEY = 'gym_checkins';

const INITIAL_SYSTEM_USERS: SystemUser[] = [
  { id: 'u1', username: 'admin', password: '123', role: Role.ADMIN, name: 'מנהל מערכת', active: true },
  { id: 'u2', username: 'trainer', password: '123', role: Role.TRAINER, name: 'מאמן תורן', active: true },
  { id: 'u3', username: 'manager', password: '123', role: Role.VIEWER, name: 'הנהלה (צפייה)', active: true },
];

const INITIAL_TRAINERS: Trainer[] = [
  { id: 't1', name: 'רן מגד', active: true },
  { id: 't2', name: 'תיאודור שפיר', active: true },
  { id: 't3', name: 'נינה טאובה', active: true },
];

const EXPIRED_END_DATE = new Date('2020-01-01').toISOString();
const EXPIRED_START_DATE = subYears(new Date('2020-01-01'), 1).toISOString();

const createResident = (id: string, first: string, last: string, expiry: string, limit: TrainingLimitation = TrainingLimitation.NONE): Resident => {
  const isExpiredPlaceholder = expiry === EXPIRED_END_DATE;
  const startDate = isExpiredPlaceholder ? EXPIRED_START_DATE : subYears(new Date(expiry), 1).toISOString();
  
  return {
    id,
    firstName: first,
    lastName: last,
    medicalConditions: '',
    trainingLimitation: limit,
    subscriptionExpiry: expiry,
    medicalCertificateStartDate: startDate
  };
};

const INITIAL_RESIDENTS: Resident[] = [
  createResident('r1', 'אריה', 'אלזס', '2026-07-08'),
  createResident('r2', 'יוסף', 'און', '2026-06-03'),
  createResident('r3', 'רבקה', 'בנסדון', EXPIRED_END_DATE),
  createResident('r4', 'יצחק', 'בכר', '2025-12-08'),
  createResident('r5', 'ברוך', 'אבידור', '2025-12-10'),
  createResident('r6', 'פרידה', 'ויינריב', '2026-02-10'),
  createResident('r7', 'פטר', 'פרקש', '2026-03-11'),
  createResident('r8', 'רבקה', 'חזן', '2026-03-09'),
  createResident('r9', 'מוטי', 'כהן', '2026-02-05'),
  createResident('r10', 'חיים', 'מודריק', '2026-03-09'),
  createResident('r11', 'שמואל', 'מנוביץ', '2025-12-11'),
  createResident('r12', 'דליה', 'צוקר', '2026-04-29'),
  createResident('r13', 'גדעון', 'נוימן', '2025-05-22'),
  createResident('r14', 'חיים', 'קדמן', EXPIRED_END_DATE),
  createResident('r15', 'יונה', 'גרינberg', '2025-12-09'),
  createResident('r16', 'מרים', 'קלינקה', '2025-12-02'),
  createResident('r17', 'מינה', 'שנהר', '2026-03-10'),
  createResident('r18', 'קלרה', 'גולדמן', '2026-05-28'),
  createResident('r19', 'דורית', 'הדר', '2025-12-25'),
  createResident('r20', 'אברהם', 'שמואלי', EXPIRED_END_DATE),
  createResident('r21', 'רות', 'פורמן', '2025-12-19'),
  createResident('r22', 'טניה', 'גרמן', '2025-12-16'),
  createResident('r23', 'מריאטה', 'דוידוביץ', '2026-12-09'),
  createResident('r24', 'אסתר', 'ג\'אוויד', '2026-08-19'),
  createResident('r25', 'מרגלית', 'איתן', '2025-08-06'),
  createResident('r26', 'ויקי', 'מונטניו', '2026-08-06'),
  createResident('r27', 'מרי', 'בן דוד', '2025-12-01'),
  createResident('r28', 'עודד', 'בר', '2025-04-10'),
  createResident('r29', 'רחל', 'זיידן', '2025-04-10'),
  createResident('r30', 'קלרה', 'מימון', '2025-10-13'),
  createResident('r31', 'יהודית', 'בכר', '2025-12-08'),
  createResident('r32', 'ציפורה', 'גורי', '2025-02-22'),
  createResident('r33', 'ישראל', 'איכר', '2025-05-27'),
  createResident('r34', 'מרים', 'גרינברג', '2025-12-05'),
  createResident('r35', 'ויקטור', 'פתחי', '2026-06-17'),
  createResident('r36', 'משה', 'ישראל', '2026-03-20'),
  createResident('r37', 'משה', 'וילדנר', '2026-03-20'),
  createResident('r38', 'חיים', 'שחר', EXPIRED_END_DATE),
  createResident('r39', 'אביבה', 'ארבל', '2026-03-27'),
  createResident('r40', 'רחל', 'רווח', '2026-04-10'),
  createResident('r41', 'יאיר', 'כהנא', '2026-04-21'),
  createResident('r42', 'אלה', 'מרגלית', '2026-02-16'),
  createResident('r43', 'יונה', 'גונן', '2026-04-29'),
  createResident('r44', 'בועז', 'גינדין', '2026-04-21'),
  createResident('r45', 'אבי', 'גולן', '2026-07-10'),
  createResident('r46', 'אלברט', 'לאון', '2026-07-14'),
  createResident('r47', 'יהודית', 'זינגר', EXPIRED_END_DATE),
  createResident('r48', 'אורי', 'כהן', '2026-09-10'),
  createResident('r49', 'מרים', 'כהן', '2026-09-09'),
  createResident('r50', 'יפה', 'גולדנסקי', '2026-09-02'),
  createResident('r51', 'חנה', 'קפון', '2026-11-09'),
  createResident('r52', 'רבקה', 'כהן', '2026-11-25'),
  createResident('r53', 'יפה', 'חרלפ\'', '2026-11-24'),
  createResident('r54', 'לאה', 'צ\'פל', '2026-12-01'),
];

const INITIAL_CHECKINS: CheckInRecord[] = [
  { id: 'c1', residentId: 'r1', residentName: 'אריה אלזס', trainerId: 't1', trainerName: 'רן מגד', timestamp: subDays(new Date(), 1).toISOString() },
];

export const loadData = <T,>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

export const saveData = <T,>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getResidents = () => loadData<Resident[]>(RESIDENTS_KEY, INITIAL_RESIDENTS);
export const saveResidents = (data: Resident[]) => saveData(RESIDENTS_KEY, data);

export const getTrainers = () => loadData<Trainer[]>(TRAINERS_KEY, INITIAL_TRAINERS);
export const saveTrainers = (data: Trainer[]) => saveData(TRAINERS_KEY, data);

export const getCheckIns = () => loadData<CheckInRecord[]>(CHECKINS_KEY, INITIAL_CHECKINS);
export const saveCheckIns = (data: CheckInRecord[]) => saveData(CHECKINS_KEY, data);

export const deleteCheckInRecord = (id: string) => {
  const checkins = getCheckIns();
  const filtered = checkins.filter(c => c.id !== id);
  saveCheckIns(filtered);
};

export const clearCheckInsForToday = () => {
  const checkins = getCheckIns();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const filtered = checkins.filter(c => format(parseISO(c.timestamp), 'yyyy-MM-dd') !== todayStr);
  saveCheckIns(filtered);
};

export const getSystemUsers = () => loadData<SystemUser[]>(USERS_KEY, INITIAL_SYSTEM_USERS);
export const saveSystemUsers = (data: SystemUser[]) => saveData(USERS_KEY, data);

export const login = async (username: string, password: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const users = getSystemUsers();
  const foundUser = users.find(u => u.username === username && u.password === password && u.active);
  if (foundUser) {
    const { password: _, ...safeUser } = foundUser;
    return safeUser;
  }
  return null;
};