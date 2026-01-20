import { Link } from 'react-router-dom';
import { Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t py-12 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="font-semibold text-xl">QueryFlow</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Intelligent data fetching with zero dependencies.
            </p>
          </div>

          {/* Documentation */}
          <div>
            <h3 className="font-semibold mb-4">Documentation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/docs" className="hover:text-foreground transition-colors">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link to="/docs/installation" className="hover:text-foreground transition-colors">
                  Installation
                </Link>
              </li>
              <li>
                <Link to="/docs/quick-start" className="hover:text-foreground transition-colors">
                  Quick Start
                </Link>
              </li>
              <li>
                <Link to="/api" className="hover:text-foreground transition-colors">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/examples" className="hover:text-foreground transition-colors">
                  Examples
                </Link>
              </li>
              <li>
                <Link to="/plugins" className="hover:text-foreground transition-colors">
                  Plugins
                </Link>
              </li>
              <li>
                <Link to="/playground" className="hover:text-foreground transition-colors">
                  Playground
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/ersinkoc/queryflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-4">Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://www.npmjs.com/package/@oxog/queryflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  npm Package
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ersinkoc/queryflow/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Report Issue
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ersinkoc/queryflow/blob/main/CHANGELOG.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Changelog
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ersinkoc/queryflow/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  MIT License
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by{' '}
            <a
              href="https://github.com/ersinkoc"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors"
            >
              Ersin KOC
            </a>
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/ersinkoc/queryflow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
