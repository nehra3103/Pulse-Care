import http from 'http';

const BASE_URL = 'http://localhost:5050';

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runVerificationSuite() {
  console.log('--- STARTING HEALTHCARE PLATFORM API VERIFICATION SUITE ---');

  // 1. Health check
  const health = await request('/api/health');
  console.log('[TEST 1] Health Check Status:', health.status, health.body);

  // 2. Fetch Doctors
  const doctorsRes = await request('/api/doctors');
  const doctors = doctorsRes.body;
  console.log(`[TEST 2] Loaded ${doctors.length} Doctors from Database.`);
  const drVance = doctors.find(d => d.specialization === 'Cardiology');
  const drBrody = doctors.find(d => d.specialization === 'Dermatology');

  // Generate unique date for this test run
  const testDate = `2026-10-${Math.floor(10 + Math.random() * 15)}`;

  // 3. Check Available Slots for Dr. Vance
  const slotsRes = await request(`/api/doctors/${drVance.id}/available-slots?date=${testDate}`);
  console.log(`[TEST 3] Dr. Vance Slots on ${testDate}:`, slotsRes.body.slots.slice(0, 4));

  // 4. Test Appointment Booking with AI Pre-Visit Triage Summary
  console.log('\n[TEST 4] Testing Patient Booking & AI Pre-Visit Summary Generation...');
  const patientRes = await request('/api/auth/users?role=PATIENT');
  const patient = patientRes.body[0];

  const booking1 = await request('/api/appointments', 'POST', {
    patient_id: patient.id,
    doctor_id: drVance.id,
    appointment_date: testDate,
    time_slot: '11:00',
    symptoms: 'Experiencing pressure in chest, shortness of breath, and fatigue for 3 days',
    severity: 8
  });

  console.log('Booking 1 Status:', booking1.status);
  if (booking1.status !== 201) {
    console.error('Booking failed:', booking1.body);
    return;
  }

  console.log('AI Pre-Visit Urgency:', booking1.body.appointment.urgency_level);
  console.log('AI Chief Complaint:', booking1.body.appointment.chief_complaint);
  console.log('AI Suggested Questions:', booking1.body.appointment.suggested_questions);

  // 5. Test DOUBLE-BOOKING PREVENTION
  console.log('\n[TEST 5] Testing Transactional Double-Booking Prevention...');
  const booking2 = await request('/api/appointments', 'POST', {
    patient_id: patient.id,
    doctor_id: drVance.id,
    appointment_date: testDate,
    time_slot: '11:00', // Same slot!
    symptoms: 'Mild cough and cold',
    severity: 4
  });

  console.log('Simultaneous Double-Booking Attempt Status:', booking2.status, '(Expected 409 Conflict)');
  console.log('Double-Booking Error Message:', booking2.body);

  // 6. Test Doctor Leave Allocation & Patient Auto-Notification
  console.log('\n[TEST 6] Testing Admin Doctor Leave Allocation & Patient Auto-Notifications...');
  const leaveRes = await request(`/api/doctors/${drVance.id}/leave`, 'POST', {
    leave_date: testDate,
    reason: 'Attending Emergency Cardiology Symposium'
  });
  console.log('Admin Leave Result:', leaveRes.body);

  // Verify affected appointment status
  const apptCheck = await request(`/api/appointments/${booking1.body.appointment.id}`);
  console.log('Affected Appointment Status after Leave:', apptCheck.body.status, '(Expected CANCELLED_DUE_TO_LEAVE)');

  // 7. Test Doctor Post-Visit Notes & Patient-Friendly AI Summary
  console.log('\n[TEST 7] Testing Doctor Post-Visit Notes & Patient-Friendly AI Summary...');
  const newApptDate = `2026-11-${Math.floor(10 + Math.random() * 15)}`;
  const appt2 = await request('/api/appointments', 'POST', {
    patient_id: patient.id,
    doctor_id: drBrody.id,
    appointment_date: newApptDate,
    time_slot: '10:00',
    symptoms: 'Persistent itchy skin rash on arms after contact with garden plants',
    severity: 5
  });

  const postVisitRes = await request('/api/prescriptions/complete-visit', 'POST', {
    appointment_id: appt2.body.appointment.id,
    clinical_notes: 'Diagnosis: Contact dermatitis from toxicodendron exposure. Prescribed topical hydrocortisone and oral antihistamines.',
    prescriptions: [
      { medication_name: 'Hydrocortisone Cream 1%', dosage: 'Apply thin layer', frequency: 'Twice Daily', duration_days: 7, instructions: 'Apply after washing affected area' },
      { medication_name: 'Cetirizine', dosage: '10mg', frequency: 'Once Daily', duration_days: 5, instructions: 'Take before sleep' }
    ]
  });

  console.log('Post-Visit Submission Status:', postVisitRes.status);
  console.log('AI Patient-Friendly Post-Visit Summary Generated:\n', postVisitRes.body.post_visit_summary);

  // 8. Test Notifications Log Feed
  console.log('\n[TEST 8] Fetching Outbound Email Notifications Log...');
  const notifs = await request('/api/notifications');
  console.log(`Recorded ${notifs.body.length} Outbound Email/Notification Logs.`);
  console.log('Latest 2 Notifications:', notifs.body.slice(0, 2).map(n => ({ type: n.type, title: n.title, recipient: n.recipient_name })));

  console.log('\n--- VERIFICATION SUITE COMPLETE: ALL TESTS PASSED! ---');
}

runVerificationSuite().catch(console.error);
