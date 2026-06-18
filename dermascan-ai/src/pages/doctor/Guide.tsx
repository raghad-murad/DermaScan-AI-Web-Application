import React from 'react';
import { Users, Upload, FileCheck, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import DoctorTopbar from '@/components/doctor/DoctorTopbar';

const steps = [
  { icon: Users, title: 'Select or Add Patient', desc: 'Search for an existing patient or register a new one with their medical details and contact information.' },
  { icon: Upload, title: 'Upload Clinical Image', desc: 'Choose the image type (clinical or dermoscopic) and upload a high-quality image of the skin lesion for AI analysis.' },
  { icon: FileCheck, title: 'Review Results', desc: 'Review the AI predictions with confidence scores.' },
];

const faqs = [
  { q: 'What image formats are supported?', a: 'We support JPG, PNG, and TIFF formats. Images should be high resolution and well-lit for optimal analysis accuracy. Maximum file size is 10MB.' },
  { q: 'How accurate is the AI analysis?', a: 'Our AI models are trained on clinically validated datasets and achieve high accuracy rates. However, the system is a decision support tool and the final diagnosis remains the physician\'s responsibility.' },
  { q: 'Can I edit a patient\'s information after creation?', a: 'Yes, navigate to the Patients page, find the patient, and click the edit icon to modify their details.' },
  { q: 'Who can see my patients\' data?', a: 'Only you can see your patients\' data. Patient records are strictly isolated per doctor account. No cross-doctor data sharing occurs.' },
];

export default function Guide() {
  return (
    <div>
      <DoctorTopbar title="User Guide" />
      <div className="p-6 max-w-3xl space-y-8">
        <div>
          <h2 className="text-2xl font-heading font-medium mb-2">How to Use DermaScan AI</h2>
          <p className="text-muted-foreground">Follow these three simple steps to analyze skin lesions with AI assistance.</p>
        </div>

        <div className="grid gap-6">
          {steps.map((s, i) => (
            <Card key={i} className="border border-border rounded-xl">
              <CardContent className="p-6 flex gap-5">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Step {i + 1}</span>
                    <h3 className="text-base font-medium">{s.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm font-medium text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}