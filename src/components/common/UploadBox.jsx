import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function UploadBox({ icon, title, description, onFileSelect, loading }) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    if (!loading) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <Card 
      className="bg-white border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center border-dashed border-2 bg-slate-50/30 group hover:border-primary/40 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.docx"
      />
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm mb-4 group-hover:text-primary transition-colors">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-body-sm text-slate-500 text-center mb-4">{description}</p>
      <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50">
        Choose File
      </Button>
    </Card>
  );
}
