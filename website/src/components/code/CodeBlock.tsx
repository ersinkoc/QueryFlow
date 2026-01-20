import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../hooks/useTheme';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export default function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className={cn('code-block', className)}>
      {/* Header with macOS traffic lights */}
      <div className="code-block-header">
        <div className="flex items-center gap-4">
          <div className="code-block-dots">
            <div className="code-block-dot code-block-dot-red" />
            <div className="code-block-dot code-block-dot-yellow" />
            <div className="code-block-dot code-block-dot-green" />
          </div>
          {filename && (
            <span className="text-sm text-muted-foreground font-mono">{filename}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase">{language}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre
          className={cn(
            'p-4 text-sm font-mono',
            theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-50'
          )}
        >
          <code>
            {lines.map((line, i) => (
              <div key={i} className="table-row">
                {showLineNumbers && (
                  <span className="table-cell pr-4 text-right text-muted-foreground select-none">
                    {i + 1}
                  </span>
                )}
                <span className="table-cell">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
