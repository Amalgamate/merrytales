import { Camera, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Memories() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Memories</h1>
          <p className="text-gray-500">Collect and share photos from your guests.</p>
        </div>
        <Button className="rounded-full shadow-soft"><Upload className="h-4 w-4 mr-2" /> Upload Photos</Button>
      </div>

      <div className="bg-lavender-light rounded-3xl border border-lavender-soft p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">QR Code Guest Uploads</h2>
        <p className="text-gray-600 max-w-lg mx-auto mb-6">
          Let your guests upload their candid photos and videos directly to this gallery. We'll generate a custom QR code for you to display at your reception tables.
        </p>
        <Button className="rounded-full bg-white text-foreground hover:bg-gray-50 shadow-soft font-bold">Generate QR Code Display</Button>
      </div>

      <div className="border-t border-border-soft pt-8">
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
          <p className="font-semibold text-gray-500">Your gallery is empty.</p>
          <p className="text-sm">Photos uploaded by you and your guests will appear here.</p>
        </div>
      </div>
    </div>
  );
}
