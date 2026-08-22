import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
let genAI = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.warn('Failed to initialize GoogleGenerativeAI:', err.message);
  }
}

/**
 * Generate Pre-Visit Symptom Summary for Doctor
 * Prompt requirement:
 * "Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>"
 */
export async function generatePreVisitSummary(symptoms, severity = 5, onsetDate = '') {
  const promptText = `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptoms} ${severity ? `(Patient reported severity: ${severity}/10)` : ''} ${onsetDate ? `(Onset date: ${onsetDate})` : ''}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const systemInstruction = `You are a medical AI triage assistant. Respond with ONLY a raw valid JSON object (no markdown codeblock tags) with keys:
"urgencyLevel": "Low" | "Medium" | "High",
"chiefComplaint": "string summary",
"suggestedQuestions": ["question 1", "question 2", "question 3"]`;

      const result = await model.generateContent(`${systemInstruction}\n\n${promptText}`);
      const text = result.response.text().trim();

      // Clean up markdown block formatting if present
      const cleanJsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);

      if (parsed.urgencyLevel && parsed.chiefComplaint && Array.isArray(parsed.suggestedQuestions)) {
        return {
          urgencyLevel: ['Low', 'Medium', 'High'].includes(parsed.urgencyLevel) ? parsed.urgencyLevel : 'Medium',
          chiefComplaint: parsed.chiefComplaint,
          suggestedQuestions: parsed.suggestedQuestions.slice(0, 3),
          rawResponse: text
        };
      }
    } catch (error) {
      console.warn('Gemini API Pre-visit summary fallback triggered:', error.message);
    }
  }

  // Graceful Fallback Summarizer (Runs seamlessly if no API key or network error)
  return fallbackPreVisitAnalysis(symptoms, severity);
}

/**
 * Heuristic Rule-Based Fallback for Pre-Visit Analysis
 */
function fallbackPreVisitAnalysis(symptoms, severity = 5) {
  const sLower = symptoms.toLowerCase();
  
  let urgency = 'Low';
  const highRisk = ['chest pain', 'shortness of breath', 'difficulty breathing', 'bleeding', 'unconscious', 'fainting', 'stroke', 'numbness', 'severe', 'excruciating', 'sudden loss'];
  const medRisk = ['fever', 'vomiting', 'dizziness', 'migraine', 'persistent', 'moderate', 'swelling', 'rash', 'sprain', 'pain for days'];

  if (highRisk.some(word => sLower.includes(word)) || severity >= 8) {
    urgency = 'High';
  } else if (medRisk.some(word => sLower.includes(word)) || severity >= 5) {
    urgency = 'Medium';
  }

  // Extract Chief Complaint
  const sentences = symptoms.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
  const chiefComplaint = sentences.length > 0 
    ? (sentences[0].length > 120 ? sentences[0].substring(0, 120) + '...' : sentences[0])
    : symptoms.substring(0, 100);

  // Generate 3 contextual clinical questions
  const suggestedQuestions = [
    `How long have these specific symptoms persisted and have they progressively worsened?`,
    `What factors or triggers tend to aggravate or relieve your discomfort?`,
    `Have you experienced any secondary symptoms such as fever, fatigue, or nausea?`
  ];

  return {
    urgencyLevel: urgency,
    chiefComplaint: `Patient reports: ${chiefComplaint}`,
    suggestedQuestions,
    rawResponse: '[Fallback AI Generator Used]'
  };
}

/**
 * Generate Post-Visit Patient Summary from Clinical Notes
 * Prompt requirement:
 * "Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>"
 */
export async function generatePostVisitSummary(clinicalNotes, prescriptions = []) {
  const prescriptionText = prescriptions.map(p => `- ${p.medication_name} (${p.dosage}): ${p.frequency} for ${p.duration_days} days. Instructions: ${p.instructions}`).join('\n');
  const promptText = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${clinicalNotes}\n\nPrescriptions:\n${prescriptionText || 'None'}`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const systemInstruction = `You are an empathetic medical communicator. Provide a patient-friendly summary divided into 3 markdown sections:
### 1. Diagnosis & What We Found
### 2. Your Medication & Care Schedule
### 3. Next Steps & Follow-Up`;

      const result = await model.generateContent(`${systemInstruction}\n\n${promptText}`);
      const text = result.response.text().trim();
      if (text) {
        return text;
      }
    } catch (error) {
      console.warn('Gemini API Post-visit summary fallback triggered:', error.message);
    }
  }

  // Graceful Fallback Generator
  return fallbackPostVisitSummary(clinicalNotes, prescriptions);
}

function fallbackPostVisitSummary(notes, prescriptions) {
  let medSummary = 'No specific prescriptions were added during this visit.';
  if (prescriptions && prescriptions.length > 0) {
    medSummary = prescriptions.map(p => 
      `• **${p.medication_name}** (${p.dosage}): Take ${p.frequency.toLowerCase()} for ${p.duration_days} days. *Note: ${p.instructions || 'Take as directed'}*`
    ).join('\n');
  }

  return `### 1. Diagnosis & Summary
${notes}

### 2. Your Medication & Care Schedule
${medSummary}

### 3. Next Steps & Follow-Up
• Monitor symptoms daily.
• Stay hydrated and take rest as advised by your doctor.
• Return for a follow-up consultation if symptoms persist or deteriorate.`;
}
