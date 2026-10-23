import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeDate,
  normalizeGender,
  parseContactNumbers,
  normalizeSports,
  normalizeStudentName,
  normalizeStudentRow,
} from './studentImport';

test('normalizeDate handles common Indian and international formats', () => {
  assert.equal(normalizeDate('19.03.2014'), '2014-03-19');
  assert.equal(normalizeDate('04-12-2019'), '2019-12-04');
  assert.equal(normalizeDate('6/10/2016'), '2016-10-06');
  assert.equal(normalizeDate('01.04.21'), '2021-04-01');
  assert.equal(normalizeDate('11-NOV-2010'), '2010-11-11');
  assert.equal(normalizeDate('25.04'), null);
});

test('normalizeGender map values correctly', () => {
  assert.equal(normalizeGender('FEMALE'), 'FEMALE');
  assert.equal(normalizeGender('male'), 'MALE');
  assert.equal(normalizeGender('M.'), 'MALE');
  assert.equal(normalizeGender(null), 'UNSPECIFIED');
  assert.equal(normalizeGender('Other'), 'UNSPECIFIED');
});

test('parseContactNumbers splits valid values and retains invalid digits', () => {
  assert.deepEqual(parseContactNumbers('9942517007'), ['9942517007']);
  assert.deepEqual(parseContactNumbers('7904550189/9789216621'), ['7904550189', '9789216621']);
  assert.deepEqual(parseContactNumbers('95666 59124'), ['9566659124']);
  assert.deepEqual(parseContactNumbers('99947903292 / 9443040233'), ['99947903292', '9443040233']);
});

test('normalizeSports and names keep messy values and title-case display names', () => {
  assert.deepEqual(normalizeSports('Skating, Shuttle, Archery'), ['Skating', 'Shuttle', 'Archery']);
  assert.deepEqual(normalizeSports(null), []);
  assert.equal(normalizeStudentName('S.PRIYADHARSHINI'), 'S. Priyadarshini');
  assert.equal(normalizeStudentName('VIDHUMITHRAN. I'), 'Vidhumithran. I');
});

test('normalizeStudentRow keeps rawData and preserves nullable fields', () => {
  const row = normalizeStudentRow({
    studentName: 'S.PRIYADHARSHINI',
    sportsSelected: 'Skating',
    dateOfBirth: '19.03.2014',
    gender: 'FEMALE',
    parentName: 'K.SELVARAJ, S.SUDHA',
    permanentAddress: 'THUMBACHIPATTI PUDHUR',
    contactNumber: '8217514241, 8072494794',
    enrollmentDate: '30.10.2025',
  });

  assert.equal(row.name, 'S. Priyadarshini');
  assert.equal(row.dateOfBirth, '2014-03-19');
  assert.equal(row.gender, 'FEMALE');
  assert.deepEqual(row.contactNumbers, ['8217514241', '8072494794']);
  assert.deepEqual(row.sportsSelected, ['Skating']);
  assert.ok(row.rawData);
  assert.equal(row.rawData.studentName, 'S.PRIYADHARSHINI');
});
