import React, { useState, useEffect } from 'react';
import { Copy, Check, X, FileCode, ChevronRight, Terminal, Info } from 'lucide-react';

// Authentic Monaco Editor (VS Code) Light Theme Syntax Highlighter
function highlightPythonLine(line) {
  if (!line && line !== '') return <span>&nbsp;</span>;
  if (line.length === 0) return <span>&nbsp;</span>;

  const trimmed = line.trimStart();
  if (trimmed.startsWith('#')) {
    return <span style={{ color: '#008000' }} className="italic font-mono">{line}</span>;
  }

  let codePart = line;
  let commentPart = null;
  const commentIdx = line.indexOf('#');
  if (commentIdx !== -1) {
    const before = line.slice(0, commentIdx);
    const singleQuotes = (before.match(/'/g) || []).length;
    const doubleQuotes = (before.match(/"/g) || []).length;
    if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
      codePart = before;
      commentPart = line.slice(commentIdx);
    }
  }

  // Tokenize Python line into strings, numbers, identifiers, symbols, whitespace
  const tokenRegex = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b[A-Za-z_]\w*\b|[^\s\w'"]+|\s+)/g;
  const tokens = codePart.match(tokenRegex) || [codePart];

  // VS Code Light keyword sets
  const controlKeywords = new Set([
    'if', 'else', 'elif', 'for', 'in', 'while', 'return',
    'try', 'except', 'finally', 'with', 'yield', 'raise',
    'pass', 'break', 'continue', 'and', 'or', 'not', 'is'
  ]);

  const declarationKeywords = new Set([
    'import', 'from', 'as', 'def', 'class', 'lambda', 'global', 'nonlocal'
  ]);

  const constantKeywords = new Set([
    'None', 'True', 'False'
  ]);

  // Monaco Light Teal Classes & Framework Models (#267f99)
  const classesAndTypes = new Set([
    'Ridge', 'Sequential', 'TimeSeriesSplit', 'GridSearchCV', 'RandomizedSearchCV',
    'LGBMRegressor', 'XGBRegressor', 'SVR', 'LSTM', 'GRU', 'Conv1D', 'MaxPooling1D',
    'Bidirectional', 'Dense', 'Dropout', 'StandardScaler', 'MinMaxScaler', 'RobustScaler',
    'Adam', 'DataFrame', 'Series', 'Input', 'BatchNormalization', 'EarlyStopping'
  ]);

  // Monaco Light Golden-Brown Functions & Methods (#795e26)
  const functionsAndBuiltins = new Set([
    'fit', 'predict', 'compile', 'print', 'len', 'range', 'append', 'split',
    'mean', 'std', 'skew', 'kurtosis', 'shapiro', 'adfuller', 'seasonal_decompose',
    'sqrt', 'mean_squared_error', 'mean_absolute_percentage_error', 'logspace',
    'uniform', 'randint', 'quantile', 'clip', 'interpolate', 'fillna', 'bfill',
    'dropna', 'shift', 'rolling', 'ewm', 'corr', 'describe', 'asfreq', 'set_index',
    'sort_values', 'items', 'sin', 'cos', 'sum', 'min', 'max', 'round', 'float', 'int', 'str'
  ]);

  return (
    <>
      {tokens.map((tok, i) => {
        // String literal -> Monaco Light Brick Red (#a31515)
        if (/^("""|'''|"|')/.test(tok)) {
          return <span key={i} style={{ color: '#a31515' }}>{tok}</span>;
        }

        // Numeric constant -> Monaco Light Green (#098658)
        if (/^\d+(\.\d+)?([eE][+-]?\d+)?$/.test(tok)) {
          return <span key={i} style={{ color: '#098658' }} className="font-mono">{tok}</span>;
        }

        // Control Keywords (if, for, return, etc.) -> Monaco Light Purple (#af00db)
        if (controlKeywords.has(tok)) {
          return <span key={i} style={{ color: '#af00db', fontWeight: 600 }}>{tok}</span>;
        }

        // Declaration Keywords (import, from, def, class) -> Monaco Light Blue (#0000ff)
        if (declarationKeywords.has(tok)) {
          return <span key={i} style={{ color: '#0000ff', fontWeight: 600 }}>{tok}</span>;
        }

        // Constants (True, False, None) -> Monaco Light Blue (#0000ff)
        if (constantKeywords.has(tok)) {
          return <span key={i} style={{ color: '#0000ff', fontWeight: 600 }}>{tok}</span>;
        }

        // Classes & Types -> Monaco Light Teal (#267f99)
        if (classesAndTypes.has(tok)) {
          return <span key={i} style={{ color: '#267f99', fontWeight: 600 }}>{tok}</span>;
        }

        // Functions & Builtins -> Monaco Light Golden Brown (#795e26)
        if (functionsAndBuiltins.has(tok)) {
          return <span key={i} style={{ color: '#795e26' }}>{tok}</span>;
        }

        // Punctuation & Operators -> Neutral Dark Charcoal (#000000 / #333333)
        if (/[=+\-*/%<>&|^~!]/.test(tok)) {
          return <span key={i} style={{ color: '#000000' }}>{tok}</span>;
        }
        if (/[()[\],.:]/.test(tok)) {
          return <span key={i} style={{ color: '#333333' }}>{tok}</span>;
        }

        // Standard Identifiers & Variables -> Monaco Light Blue-Black (#001080)
        if (/^[A-Za-z_]\w*$/.test(tok)) {
          return <span key={i} style={{ color: '#001080' }}>{tok}</span>;
        }

        return <span key={i} style={{ color: '#1f2328' }}>{tok}</span>;
      })}
      {commentPart && (
        <span style={{ color: '#008000' }} className="italic font-mono">{commentPart}</span>
      )}
    </>
  );
}

export default function CodeModal({ isOpen, onClose, snippet }) {
  const [copied, setCopied] = useState(false);

  // Background Scroll Locking + Escape Key listener
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !snippet) return null;

  const handleCopy = () => {
    if (snippet?.code) {
      navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const rawCode = snippet.code ? snippet.code.trim() : '# No code snippet provided';
  const lines = rawCode.split('\n');
  const fileName = snippet.file ? snippet.file.split('/').pop() : 'script.py';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white border border-[#e1e4e8] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Monaco Window Header & Tab Strip (Light Theme) */}
        <div className="flex items-center justify-between px-3 pt-2 pb-0 bg-[#f3f3f3] border-b border-[#e1e4e8] select-none">
          <div className="flex items-center gap-3">
            {/* Window control dots */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block" />
            </div>

            {/* Monaco Active File Tab */}
            <div className="flex items-center gap-2 bg-white border-t-2 border-t-[#007acc] border-x border-b border-x-[#e1e4e8] border-b-white px-3.5 py-1.5 rounded-t text-xs font-mono text-[#333333] shadow-2xs relative top-[1px]">
              {/* Python file icon */}
              <div className="w-3.5 h-3.5 flex items-center justify-center font-bold text-[10px] text-[#3776ab] bg-blue-50 border border-blue-200 rounded-xs">
                Py
              </div>
              <span className="font-medium text-zinc-900">{fileName}</span>
              <button
                type="button"
                onClick={onClose}
                className="ml-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 p-0.5 rounded transition-colors"
                title="Close Tab (Esc)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Action Toolbar on Right */}
          <div className="flex items-center gap-2 pb-1.5">
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-500 bg-zinc-200/70 border border-zinc-300 px-2 py-0.5 rounded">
              {snippet.framework || 'Python 3.11'}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-[#d1d5db] text-xs font-sans font-medium text-[#24292f] transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/80 transition-colors"
              title="Close Modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Monaco Breadcrumb Bar */}
        <div className="bg-[#f8f9fa] border-b border-[#e1e4e8] px-4 py-1 text-[11px] font-mono text-zinc-500 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            <span>workspace</span>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>c24_co2_forecast</span>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-zinc-800 font-semibold">{snippet.file || 'script.py'}</span>
          </div>

          <div className="text-[11px] text-zinc-500 font-sans hidden sm:block">
            {snippet.title}
          </div>
        </div>

        {/* Snippet Documentation / Docstring Header */}
        {snippet.description && (
          <div className="px-4 py-2 bg-[#fcfcfd] border-b border-[#e5e7eb] text-xs text-zinc-600 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#007acc] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-zinc-800">{snippet.title}: </span>
              {snippet.description}
            </div>
          </div>
        )}

        {/* Monaco Light Editor Canvas (Pure White Background, Line Gutter, VS Code Syntax Highlighting) */}
        <div className="flex-1 overflow-auto bg-white font-mono text-[12.5px] leading-[1.65] select-text">
          <div className="flex min-w-full">
            {/* Monaco Gutter (Line Numbers) */}
            <div
              className="select-none text-[#858585] text-right font-mono text-[11.5px] leading-[1.65] bg-[#f8f9fa] border-r border-[#e1e4e8] pr-3 pl-3 shrink-0 py-2.5"
              style={{ minWidth: '48px' }}
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Monaco Code Viewport */}
            <div className="pl-3.5 pr-4 py-2.5 overflow-x-auto whitespace-pre font-mono text-[12.5px] leading-[1.65] flex-1 text-[#1f2328]">
              {lines.map((line, idx) => (
                <div key={idx} className="hover:bg-[#f2f4f8] -mx-1 px-1 rounded-xs transition-colors">
                  {highlightPythonLine(line)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monaco Status Bar (Authentic VS Code Light Blue Status Bar) */}
        <div className="bg-[#007acc] text-white px-3 py-1 flex items-center justify-between text-[11px] font-mono select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 opacity-90" />
              <span>main*</span>
            </span>
            <span className="hidden sm:inline opacity-90">|</span>
            <span className="hidden sm:inline">Ln {lines.length}, Col 1</span>
            <span className="opacity-90">|</span>
            <span>Spaces: 4</span>
            <span className="hidden sm:inline opacity-90">|</span>
            <span className="hidden sm:inline">UTF-8</span>
            <span className="hidden sm:inline opacity-90">|</span>
            <span className="hidden sm:inline">LF</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span>Python 3.11</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10.5px] font-sans transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
