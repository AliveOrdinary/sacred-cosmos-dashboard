import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

export function PostCaptionCard({ postCaption, setPostCaption, isCopied, handleCopyCaption }) {
  return (
    <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl mt-8">
      <CardHeader className="pb-3 flex flex-row justify-between items-center border-b border-slate-800">
        <div>
          <CardTitle className="text-sm font-medium text-emerald-400">Post Caption</CardTitle>
          <CardDescription className="text-xs text-slate-500">Edit the generated caption before exporting</CardDescription>
        </div>
        <Button
          variant={isCopied ? 'default' : 'secondary'}
          size="sm"
          onClick={handleCopyCaption}
          className={`flex gap-2 ${isCopied ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <textarea
          value={postCaption}
          onChange={(e) => setPostCaption(e.target.value)}
          className="w-full h-64 bg-slate-950 text-slate-300 p-6 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none font-mono text-sm leading-relaxed"
          placeholder="Your brilliant n8n caption will appear here..."
        />
      </CardContent>
    </Card>
  )
}
