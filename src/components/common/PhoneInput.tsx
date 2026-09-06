import React, { useState, useEffect, useMemo } from 'react';
import { Phone, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

export interface CountryCode {
  name: string;
  code: string;
  flag: string;
  sample: string;
}

export const COUNTRIES: CountryCode[] = [
  { name: 'India', code: '+91', flag: '🇮🇳', sample: '98765 43210' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', sample: '50 123 4567' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', sample: '8123 4567' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾', sample: '12 345 6789' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', sample: '7123 456789' },
  { name: 'United States / Canada', code: '+1', flag: '🇺🇸', sample: '202 555 0123' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', sample: '50 123 4567' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦', sample: '3312 3456' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼', sample: '5123 4567' },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭', sample: '3612 3456' },
  { name: 'Oman', code: '+968', flag: '🇴🇲', sample: '9123 4567' },
  { name: 'Sri Lanka', code: '+94', flag: '🇱🇰', sample: '71 234 5678' },
  { name: 'Australia', code: '+61', flag: '🇦🇺', sample: '412 345 678' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩', sample: '812 3456 7890' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭', sample: '81 234 5678' },
  { name: 'Germany', code: '+49', flag: '🇩🇪', sample: '151 2345678' },
  { name: 'France', code: '+33', flag: '🇫🇷', sample: '6 12 34 56 78' },
  { name: 'Japan', code: '+81', flag: '🇯🇵', sample: '90 1234 5678' },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullPhoneNumber: string, digitsOnly: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: 'dark' | 'light';
  id?: string;
}

/**
 * Normalizes an incoming raw phone string (which could be in scientific notation like "9.789237332E9",
 * or international format "+91 9884412345", or bare 10-digit "9884412345").
 */
export function parsePhoneNumber(raw: string): { countryCode: string; digits: string } {
  if (!raw) return { countryCode: '+91', digits: '' };

  let sanitized = String(raw).trim();

  // Handle scientific notation from Excel imports (e.g. 9.789237332E9)
  if (/^[0-9.]+e\+[0-9]+$/i.test(sanitized) || /^[0-9.]+e[0-9]+$/i.test(sanitized)) {
    const parsedNum = Math.round(Number(sanitized));
    if (!isNaN(parsedNum)) {
      sanitized = String(parsedNum);
    }
  }

  // Find if a country code is present
  let matchedCountryCode = '+91';
  for (const country of COUNTRIES) {
    if (sanitized.startsWith(country.code)) {
      matchedCountryCode = country.code;
      sanitized = sanitized.slice(country.code.length).trim();
      break;
    }
  }

  // Strip all non-digit characters and strictly keep up to 10 digits
  const digits = sanitized.replace(/\D/g, '').slice(0, 10);

  return {
    countryCode: matchedCountryCode,
    digits,
  };
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label = 'Mobile Number (10 Digits)',
  placeholder = '98765 43210',
  required = false,
  disabled = false,
  variant = 'dark',
  id,
}) => {
  // Parse incoming value into country code and 10 digits
  const parsed = useMemo(() => parsePhoneNumber(value), [value]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(parsed.countryCode);
  const [digits, setDigits] = useState<string>(parsed.digits);

  // Sync internal state when external value changes
  useEffect(() => {
    const nextParsed = parsePhoneNumber(value);
    setSelectedCountryCode(nextParsed.countryCode);
    setDigits(nextParsed.digits);
  }, [value]);

  const handleCountryChange = (newCode: string) => {
    setSelectedCountryCode(newCode);
    const isValid = digits.length === 10;
    const fullValue = digits ? `${newCode} ${digits}` : '';
    onChange(fullValue, digits, isValid);
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strictly filter out non-digit characters and enforce exactly max 10 digits
    const inputVal = e.target.value;
    const cleanDigits = inputVal.replace(/\D/g, '').slice(0, 10);
    setDigits(cleanDigits);

    const isValid = cleanDigits.length === 10;
    const fullValue = cleanDigits ? `${selectedCountryCode} ${cleanDigits}` : '';
    onChange(fullValue, cleanDigits, isValid);
  };

  const isDark = variant === 'dark';
  const isComplete = digits.length === 10;
  const isPartiallyFilled = digits.length > 0 && digits.length < 10;

  return (
    <div className="space-y-1.5 text-left">
      {label && (
        <div className="flex items-center justify-between">
          <label 
            htmlFor={id} 
            className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span 
            className={`text-[10px] font-mono font-bold tracking-wider ${
              isComplete
                ? 'text-emerald-400'
                : isPartiallyFilled
                ? 'text-amber-400'
                : isDark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {digits.length}/10 digits
          </span>
        </div>
      )}

      <div className="flex rounded-xl overflow-hidden shadow-sm">
        {/* Country Code Dropdown */}
        <div className="relative shrink-0">
          <select
            value={selectedCountryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={disabled}
            className={`h-full appearance-none pl-3 pr-8 py-2.5 text-xs font-bold border-r cursor-pointer focus:outline-none transition-colors ${
              isDark
                ? 'bg-gbl-navy-900 border-gbl-navy-700 text-white hover:bg-gbl-navy-850 focus:border-gbl-orange-500'
                : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200 focus:border-emerald-500'
            }`}
            title="Select Country Calling Code"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code + c.name} value={c.code} className={isDark ? 'bg-gbl-navy-950 text-white' : 'bg-white text-slate-900'}>
                {c.flag} {c.code} ({c.name})
              </option>
            ))}
          </select>
          <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </div>

        {/* 10-Digit Mobile Input */}
        <div className="relative flex-1">
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={digits}
            onChange={handleDigitsChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3.5 py-2.5 text-xs font-mono tracking-wider transition-colors focus:outline-none ${
              isDark
                ? `bg-gbl-navy-950 text-white placeholder-slate-500 border border-l-0 ${
                    isComplete
                      ? 'border-emerald-500/60 focus:border-emerald-400'
                      : isPartiallyFilled
                      ? 'border-amber-500/60 focus:border-amber-400'
                      : 'border-gbl-navy-700 focus:border-gbl-orange-500'
                  }`
                : `bg-white text-slate-900 placeholder-slate-400 border border-l-0 ${
                    isComplete
                      ? 'border-emerald-500 focus:border-emerald-600'
                      : isPartiallyFilled
                      ? 'border-amber-500 focus:border-amber-600'
                      : 'border-slate-300 focus:border-emerald-500'
                  }`
            }`}
          />

          {/* Validation Status Indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-75 duration-150" />
            ) : isPartiallyFilled ? (
              <span className="text-[10px] font-bold text-amber-400 font-sans">
                {10 - digits.length} left
              </span>
            ) : (
              <Phone className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            )}
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between px-1">
        {isPartiallyFilled ? (
          <p className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Must be exactly 10 digits ({digits.length}/10 entered)</span>
          </p>
        ) : isComplete ? (
          <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Valid 10-digit mobile number ({selectedCountryCode} {digits})</span>
          </p>
        ) : (
          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Enter 10-digit mobile number (numbers only)
          </p>
        )}
      </div>
    </div>
  );
};
