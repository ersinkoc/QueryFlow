import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import CodeBlock from '../components/code/CodeBlock';

const defaultCode = `import { createClient, query } from '@oxog/queryflow';

// Create a client
const client = createClient({
  baseUrl: 'https://jsonplaceholder.typicode.com',
});

// Fetch users
const users = await query('/users').fetch();
console.log('Users:', users);

// Fetch a single user
const user = await query('/users/1').fetch();
console.log('User:', user);`;

export default function PlaygroundPage() {
  const [code, setCode] = useState(defaultCode);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...\n');

    try {
      // In a real implementation, this would:
      // 1. Send code to a sandboxed execution environment
      // 2. Or use a WebContainer/iframe sandbox
      // For demo, we'll just show a placeholder

      setOutput(`// Output will appear here
//
// Note: Live code execution requires a sandboxed environment.
// For now, copy the code and run it locally:
//
// 1. npm install @oxog/queryflow
// 2. Create a file with this code
// 3. Run with ts-node or compile with tsc

Users: [
  { id: 1, name: "Leanne Graham", ... },
  { id: 2, name: "Ervin Howell", ... },
  ...
]

User: { id: 1, name: "Leanne Graham", ... }`);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(defaultCode);
    setOutput('');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Playground</h1>
          <p className="text-lg text-muted-foreground">
            Experiment with QueryFlow in your browser.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
              <span className="font-medium">Code</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="p-2 rounded hover:bg-muted transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[400px] bg-transparent font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Output */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/50">
              <span className="font-medium">Output</span>
            </div>
            <div className="p-4 h-[400px] overflow-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {output || '// Click "Run" to execute the code'}
              </pre>
            </div>
          </div>
        </div>

        {/* Examples */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Try These Examples</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: 'Basic Query',
                code: `const users = await query('/users').fetch();
console.log(users);`,
              },
              {
                title: 'With Parameters',
                code: `const user = await query('/users/:id', {
  params: { id: '1' }
}).fetch();
console.log(user);`,
              },
              {
                title: 'Error Handling',
                code: `const { data, error } = await query('/users').fetchSafe();
if (error) {
  console.error('Failed:', error);
} else {
  console.log('Users:', data);
}`,
              },
            ].map((example) => (
              <button
                key={example.title}
                onClick={() => setCode(`import { createClient, query } from '@oxog/queryflow';

const client = createClient({
  baseUrl: 'https://jsonplaceholder.typicode.com',
});

${example.code}`)}
                className="p-4 rounded-xl border bg-card text-left hover:border-primary/50 transition-colors"
              >
                <h3 className="font-semibold mb-2">{example.title}</h3>
                <pre className="text-xs text-muted-foreground font-mono overflow-hidden">
                  {example.code.slice(0, 100)}...
                </pre>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
