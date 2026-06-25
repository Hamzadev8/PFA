'use client';
import PredictionForm from '../../components/PredictionForm';
import { predictDiabetes } from '../../lib/api';
import { Droplet } from 'lucide-react';

const fields = [
  { name: 'Pregnancies',              label: 'Nombre de grossesses',       min: 0, max: 20,   step: 1,    example: 2,    unit: '' },
  { name: 'Glucose',                  label: 'Glucose (mg/dL)',             min: 0, max: 300,  step: 1,    example: 120,  unit: 'mg/dL' },
  { name: 'BloodPressure',            label: 'Pression artérielle (mm Hg)', min: 0, max: 200,  step: 1,    example: 70,   unit: 'mm Hg' },
  { name: 'SkinThickness',            label: 'Épaisseur peau (mm)',         min: 0, max: 100,  step: 1,    example: 20,   unit: 'mm' },
  { name: 'Insulin',                  label: 'Insuline (mu U/ml)',          min: 0, max: 1000, step: 1,    example: 80,   unit: 'mu U/ml' },
  { name: 'BMI',                      label: 'IMC (kg/m²)',                 min: 0, max: 70,   step: 0.1,  example: 25.5, unit: 'kg/m²' },
  { name: 'DiabetesPedigreeFunction', label: 'Fonction pedigree diabète',   min: 0, max: 3,    step: 0.01, example: 0.5,  unit: '' },
  { name: 'Age',                      label: 'Âge (ans)',                   min: 1, max: 120,  step: 1,    example: 35,   unit: 'ans' },
];

export default function DiabetesPage() {
  return (
    <PredictionForm
      diseaseCode="diabetes"
      title="Analyse prédictive — Diabète"
      subtitle="Saisissez les paramètres cliniques du patient pour évaluer la probabilité de risque de diabète."
      icon={Droplet}
      accent="blue"
      fields={fields}
      predictFn={predictDiabetes}
    />
  );
}
