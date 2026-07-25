import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, User, Download, Filter, Info } from 'lucide-react';

interface Period {
  id: number;
  time: string;
  label: string;
  isBreak?: boolean;
}

const PERIODS: Period[] = [
  { id: 1, time: '09.30 - 10.20', label: 'Period 1' },
  { id: 2, time: '10.20 - 11.10', label: 'Period 2' },
  { id: -1, time: '11.10 - 11.25', label: 'TEA BREAK', isBreak: true },
  { id: 3, time: '11.25 - 12.15', label: 'Period 3' },
  { id: 4, time: '12.15 - 01.05', label: 'Period 4' },
  { id: -2, time: '01.05 - 02.00', label: 'LUNCH BREAK', isBreak: true },
  { id: 5, time: '02.00 - 02.50', label: 'Period 5' },
  { id: 6, time: '02.50 - 03.40', label: 'Period 6' },
  { id: 7, time: '03.40 - 04.30', label: 'Extra Class' },
];

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

// Master timetable structure [Day][Year][Period]
const TIMETABLE_DATA: Record<string, Record<string, Record<number, string>>> = {
  MONDAY: {
    'I Year': { 1: 'PHYSICS', 2: 'ENGLISH', 3: 'MATHS-I', 4: 'PYTHON LAB', 5: 'BE&ECEA', 6: 'PYTHON' },
    'II Year': { 1: 'SM', 2: 'MATHS III', 3: 'LIBRARY', 4: 'FM', 5: 'CADD LAB', 6: 'CADD LAB' },
    'III Year': { 1: 'SD 1', 2: 'IE&HS', 3: 'TE', 4: 'GURUKULA', 5: 'EE', 6: 'CES&GI' },
    'IV Year': { 1: 'PE IV', 2: 'TUTORIAL', 3: 'DSS', 4: 'GURUKULA', 5: 'PE V', 6: 'PE III' },
  },
  TUESDAY: {
    'I Year': { 1: 'BE&ECEA LAB', 2: 'BE&ECEA LAB', 3: 'BE&ECEA LAB', 4: 'PYTHON', 5: 'IDEA LAB', 6: 'IDEA LAB' },
    'II Year': { 1: 'FM', 2: 'SM LAB', 3: 'SM LAB', 4: 'SM LAB', 5: 'S&G', 6: 'SANTHI SENA' },
    'III Year': { 1: 'SA I', 2: 'SA I', 3: 'TE', 4: 'IE&HS', 5: 'EE', 6: 'SD 1' },
    'IV Year': { 1: 'CEM', 2: 'PE III', 3: 'PROJECT II', 4: 'PROJECT II', 5: 'DSS', 6: 'LIBRARY' },
  },
  WEDNESDAY: {
    'I Year': { 1: 'BE&ECEA', 2: 'MATHS 1', 3: 'DESIGN THINKING', 4: 'DESIGN THINKING', 5: 'PHYSICS', 6: 'ENGLISH' },
    'II Year': { 1: 'S&G', 2: 'SM', 3: 'Shramadhan', 4: 'MATHS III', 5: 'CADD LAB', 6: 'CADD LAB' },
    'III Year': { 1: 'EE LAB', 2: 'EE LAB', 3: 'EE LAB', 4: 'Software skill -II', 5: 'TE', 6: 'OE III' },
    'IV Year': { 1: 'CEM', 2: 'PE IV', 3: 'PROJECT II', 4: 'PROJECT II', 5: 'PE V', 6: 'TUTORIAL' },
  },
  THURSDAY: {
    'I Year': { 1: 'ENGLISH', 2: 'YOGA', 3: 'MATHS I', 4: 'BE&ECEA', 5: 'PYTHON LAB', 6: 'PYTHON LAB' },
    'II Year': { 1: 'S&G LAB', 2: 'S&G LAB', 3: 'S&G LAB', 4: 'LIBRARY', 5: 'IKS', 6: 'IKS' },
    'III Year': { 1: 'SA I', 2: 'LIBRARY', 3: 'SD 1', 4: 'Tutorial', 5: 'Shramadhan', 6: 'IE&HS / Shramadhan' },
    'IV Year': { 1: 'DSS', 2: 'CEM', 3: 'PE III', 4: 'DBCS', 5: 'DBCS', 6: 'Shramadhan' },
  },
  FRIDAY: {
    'I Year': { 1: 'PHYSICS LAB', 2: 'PHYSICS LAB', 3: 'PHYSICS LAB', 4: 'PYTHON', 5: 'MATHS 1', 6: 'PHYSICS' },
    'II Year': { 1: 'FM', 2: 'SM', 3: 'GURUKULA', 4: 'S&G', 5: 'MATHS III', 6: 'PRAYER' },
    'III Year': { 1: 'CES&GI', 2: 'TE LAB', 3: 'TE LAB', 4: 'TE LAB', 5: 'EE', 6: 'EE' },
    'IV Year': { 1: 'PE IV', 2: 'DBCS', 3: 'PE V', 4: 'PROJECT II', 5: 'PROJECT II', 6: 'PROJECT II' },
  },
};

// Faculty & Subject mapping legend from the official timetable document
const SUBJECT_FACULTY_MAPPING = [
  {
    year: 'I Year',
    subjects: [
      { code: 'ENG', name: 'English for Technical Writing', faculty: 'School of English' },
      { code: 'PHY', name: 'Physics (Introduction to Mechanics)', faculty: 'Dept. Of Physics' },
      { code: 'MATH-1', name: 'Mathematics-I', faculty: 'Dr. A. A. Navish' },
      { code: 'BE&ECEA', name: 'Basic Electrical & Electronics for Civil Engg.', faculty: 'Mr. Kumaresan' },
      { code: 'PYTHON', name: 'Python Programming', faculty: 'Dr. C. Kirubakaran' },
      { code: 'YOGA', name: 'Yoga Education', faculty: 'Dr. S. Sugumar' },
      { code: 'PHY LAB', name: 'Physics Laboratory', faculty: 'Dept. Of Physics' },
      { code: 'BE LAB', name: 'Basic Electrical & Electronics Lab', faculty: 'Mr. T. Kumaresan' },
      { code: 'PY LAB', name: 'Python Programming Laboratory', faculty: 'Dr. C. Kirubakaran' },
      { code: 'DT', name: 'Design Thinking', faculty: 'Dr. B. Sangeethavani, Dr. J. Jeseema Nisrin' },
      { code: 'IDEA', name: 'Idea Laboratory Workshop', faculty: 'Dr. B. Sangeethavani, Dr. J. Jeseema Nisrin' },
    ],
  },
  {
    year: 'II Year',
    subjects: [
      { code: 'OE-I', name: 'Open Elective - I', faculty: 'Dr. R. T. Balamurali' },
      { code: 'FM', name: 'Fluid Mechanics', faculty: 'Mr. G. Jegadhesh' },
      { code: 'SM', name: 'Solid Mechanics', faculty: 'Dr. K. Infant Xavier' },
      { code: 'MATH-III', name: 'Mathematics - III', faculty: 'Dr. Vinoth' },
      { code: 'S&G', name: 'Surveying and Geomatics', faculty: 'Dr. S. Uma' },
      { code: 'IKS', name: 'Indian Knowledge System', faculty: 'Dr. Rajarajan, School of Tamil' },
      { code: 'SS', name: 'Shanti Sena', faculty: 'Dr. Lakshmi' },
      { code: 'S&G LAB', name: 'Surveying and Geomatics Laboratory', faculty: 'Dr. S. Uma, Dr. K. Infant Xavier' },
      { code: 'SM LAB', name: 'Solid Mechanics Laboratory', faculty: 'Dr. K. Infant Xavier, Mr. P. Marimuthu' },
      { code: 'CADD LAB', name: 'Computer Aided Civil Engineering Drawing', faculty: 'Dr. R. T. Balamurali, Mrs. S. Abinaya' },
    ],
  },
  {
    year: 'III Year',
    subjects: [
      { code: 'SD 1', name: 'Structural Design - I (Design of Concrete Structures)', faculty: 'Dr. R. T. Balamurali' },
      { code: 'EE', name: 'Environmental Engineering', faculty: 'Mr. G. Jegadhesh' },
      { code: 'IE&HS', name: 'Irrigation Engineering & Hydraulic Structures', faculty: 'Dr. B. Sangeethavani' },
      { code: 'TE', name: 'Transportation Engineering', faculty: 'Dr. S. Uma' },
      { code: 'SA I', name: 'Structural Analysis - I', faculty: 'Dr. J. Jeseema Nisrin' },
      { code: 'OE III', name: 'Open Elective - III', faculty: 'Mrs. S. Abinaya' },
      { code: 'CES&GI', name: 'Civil Engineering Society and Global Impact', faculty: 'Er. P. Marimuthu' },
      { code: 'TE LAB', name: 'Transportation Engineering Laboratory', faculty: 'Dr. R. T. Balamurali, Mrs. S. Abinaya' },
      { code: 'EE LAB', name: 'Environmental Engineering Laboratory', faculty: 'Chemistry Dept' },
      { code: 'SS-II', name: 'Software Skill Development - II', faculty: 'Staff' },
    ],
  },
  {
    year: 'IV Year',
    subjects: [
      { code: 'DSS', name: 'Design of Steel Structures', faculty: 'Dr. R. T. Balamurali' },
      { code: 'DBCS', name: 'Design of Brick and Concrete Structures', faculty: 'Dr. J. Jeseema Nisrin' },
      { code: 'CEM', name: 'Construction Engineering and Management', faculty: 'Mrs. S. Abinaya' },
      { code: 'PE III', name: 'Professional Elective-III: Watershed Conservation', faculty: 'Dr. B. Sangeethavani' },
      { code: 'PE IV', name: 'Professional Elective-IV: Air Noise Pollution', faculty: 'Dr. S. Uma' },
      { code: 'PE V', name: 'Professional Elective-V: Masonry Structures', faculty: 'Mr. K. Infant Xavier' },
      { code: 'PROJECT II', name: 'Project - II', faculty: 'Dr. B. Sangeethavani, Dr. R. T. Balamurali' },
    ],
  },
];

export const SharedTimetable: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const years = ['All', 'I Year', 'II Year', 'III Year', 'IV Year'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-custom p-6 border border-borderLight shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              <Calendar className="h-4 w-4" /> Academic Schedule 2026-2027 (Odd Semester)
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              Department of Civil Engineering — Class Timetable
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              The Gandhigram Rural Institute — Deemed to be University (Tentative Schedule)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-custom transition-all"
            >
              <Download className="h-4 w-4" /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 pt-4 border-t border-borderLight flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Year:
            </span>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-custom text-xs font-medium whitespace-nowrap transition-all ${
                  selectedYear === y
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {y === 'All' ? 'All 4 Years (Master View)' : y}
              </button>
            ))}
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search subject or period..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-borderLight rounded-custom focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Timetable Display */}
      {selectedYear === 'All' ? (
        /* Master Grid View (Matches physical printout layout) */
        <div className="bg-white rounded-custom border border-borderLight shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-borderLight flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Master Weekly Timetable (All 4 Years)
            </h2>
            <span className="text-xs text-slate-500">6 Periods Daily • Mon-Fri</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-borderLight text-slate-700 font-bold">
                  <th className="p-2 border-r border-borderLight w-24">DAY</th>
                  <th className="p-2 border-r border-borderLight w-16">YEAR</th>
                  {PERIODS.map((p) => (
                    <th
                      key={p.time}
                      className={`p-2 border-r border-borderLight ${
                        p.isBreak ? 'bg-amber-50 text-amber-800 w-16' : 'min-w-[110px]'
                      }`}
                    >
                      <div className="font-semibold">{p.label}</div>
                      <div className="text-[10px] font-normal text-slate-500">{p.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight text-slate-800">
                {DAYS.map((day) => {
                  const dayYears = ['I Year', 'II Year', 'III Year', 'IV Year'];
                  return dayYears.map((yr, idx) => (
                    <tr
                      key={`${day}-${yr}`}
                      className={`hover:bg-slate-50 transition-colors ${
                        idx === 3 ? 'border-b-2 border-slate-300' : ''
                      }`}
                    >
                      {idx === 0 && (
                        <td
                          rowSpan={4}
                          className="p-3 font-bold bg-slate-50 text-primary border-r border-borderLight align-middle text-sm tracking-wide"
                        >
                          {day}
                        </td>
                      )}
                      <td className="p-2 font-semibold bg-slate-50 text-slate-700 border-r border-borderLight">
                        {yr.split(' ')[0]}
                      </td>

                      {/* Period 1 & 2 */}
                      <td className={`p-2 border-r border-borderLight font-medium ${
                        searchQuery && TIMETABLE_DATA[day][yr][1]?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'bg-yellow-100 font-bold' : ''
                      }`}>
                        {TIMETABLE_DATA[day][yr][1] || '-'}
                      </td>
                      <td className={`p-2 border-r border-borderLight font-medium ${
                        searchQuery && TIMETABLE_DATA[day][yr][2]?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'bg-yellow-100 font-bold' : ''
                      }`}>
                        {TIMETABLE_DATA[day][yr][2] || '-'}
                      </td>

                      {/* Tea Break column */}
                      {idx === 0 && (
                        <td
                          rowSpan={20}
                          className="p-1 bg-amber-50 text-amber-700 font-bold border-r border-borderLight align-middle tracking-widest text-[11px] [writing-mode:vertical-lr] rotate-180"
                        >
                          TEA BREAK (11.10 - 11.25)
                        </td>
                      )}

                      {/* Period 3 & 4 */}
                      <td className={`p-2 border-r border-borderLight font-medium ${
                        searchQuery && TIMETABLE_DATA[day][yr][3]?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'bg-yellow-100 font-bold' : ''
                      }`}>
                        {TIMETABLE_DATA[day][yr][3] || '-'}
                      </td>
                      <td className={`p-2 border-r border-borderLight font-medium ${
                        searchQuery && TIMETABLE_DATA[day][yr][4]?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'bg-yellow-100 font-bold' : ''
                      }`}>
                        {TIMETABLE_DATA[day][yr][4] || '-'}
                      </td>

                      {/* Lunch Break column */}
                      {idx === 0 && (
                        <td
                          rowSpan={20}
                          className="p-1 bg-amber-100 text-amber-900 font-bold border-r border-borderLight align-middle tracking-widest text-[11px] [writing-mode:vertical-lr] rotate-180"
                        >
                          LUNCH BREAK (01.05 - 02.00)
                        </td>
                      )}

                      {/* Period 5 & 6 */}
                      <td className={`p-2 border-r border-borderLight font-medium ${
                        searchQuery && TIMETABLE_DATA[day][yr][5]?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'bg-yellow-100 font-bold' : ''
                      }`}>
                        {TIMETABLE_DATA[day][yr][5] || '-'}
                      </td>
                      <td className={`p-2 border-r border-borderLight font-medium ${
                        searchQuery && TIMETABLE_DATA[day][yr][6]?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'bg-yellow-100 font-bold' : ''
                      }`}>
                        {TIMETABLE_DATA[day][yr][6] || '-'}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Single Year Focused View */
        <div className="bg-white rounded-custom border border-borderLight shadow-xs overflow-hidden">
          <div className="p-4 bg-primary text-white flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Weekly Schedule for {selectedYear}
            </h2>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
              Civil Engineering
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-borderLight text-slate-700 font-bold">
                  <th className="p-3 border-r border-borderLight w-28">DAY</th>
                  {PERIODS.map((p) => (
                    <th
                      key={p.time}
                      className={`p-3 border-r border-borderLight ${
                        p.isBreak ? 'bg-amber-50 text-amber-900 w-24 text-center' : 'min-w-[130px]'
                      }`}
                    >
                      <div>{p.label}</div>
                      <div className="text-[10px] font-normal text-slate-500">{p.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight text-slate-800">
                {DAYS.map((day) => (
                  <tr key={day} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold bg-slate-50 text-primary border-r border-borderLight text-xs tracking-wider">
                      {day}
                    </td>

                    {/* Period 1 & 2 */}
                    <td className="p-3 border-r border-borderLight font-semibold text-slate-700 bg-slate-50/30">
                      {TIMETABLE_DATA[day][selectedYear][1] || '-'}
                    </td>
                    <td className="p-3 border-r border-borderLight font-semibold text-slate-700 bg-slate-50/30">
                      {TIMETABLE_DATA[day][selectedYear][2] || '-'}
                    </td>

                    {/* Tea Break */}
                    <td className="p-2 border-r border-borderLight bg-amber-50/60 text-amber-800 text-center font-bold text-[10px]">
                      TEA BREAK
                    </td>

                    {/* Period 3 & 4 */}
                    <td className="p-3 border-r border-borderLight font-semibold text-slate-700 bg-slate-50/30">
                      {TIMETABLE_DATA[day][selectedYear][3] || '-'}
                    </td>
                    <td className="p-3 border-r border-borderLight font-semibold text-slate-700 bg-slate-50/30">
                      {TIMETABLE_DATA[day][selectedYear][4] || '-'}
                    </td>

                    {/* Lunch Break */}
                    <td className="p-2 border-r border-borderLight bg-amber-100/60 text-amber-900 text-center font-bold text-[10px]">
                      LUNCH BREAK
                    </td>

                    {/* Period 5 & 6 */}
                    <td className="p-3 border-r border-borderLight font-semibold text-slate-700 bg-slate-50/30">
                      {TIMETABLE_DATA[day][selectedYear][5] || '-'}
                    </td>
                    <td className="p-3 border-r border-borderLight font-semibold text-slate-700 bg-slate-50/30">
                      {TIMETABLE_DATA[day][selectedYear][6] || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Faculty and Subject Reference Section */}
      <div className="bg-white rounded-custom p-6 border border-borderLight shadow-xs">
        <div className="flex items-center gap-2 text-base font-bold text-slate-800 border-b border-borderLight pb-3 mb-4">
          <User className="h-5 w-5 text-primary" /> Subject & Faculty Directory Reference
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBJECT_FACULTY_MAPPING.map((group) => {
            if (selectedYear !== 'All' && selectedYear !== group.year) return null;
            return (
              <div key={group.year} className="bg-slate-50 rounded-custom p-4 border border-borderLight">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-sm text-primary">{group.year} Courses & Faculty</h3>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border">
                    {group.subjects.length} Subjects
                  </span>
                </div>
                <div className="space-y-2">
                  {group.subjects.map((sub, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded-custom border border-slate-200 flex items-start justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                            {sub.code}
                          </span>
                          {sub.name}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-medium text-slate-600 text-[11px] block">{sub.faculty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SharedTimetable;
