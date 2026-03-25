import moment from 'moment';

export const EXPORT_LANGUAGE_OPTIONS = {
    th: {
        label: 'TH',
        locale: 'th-TH',
    },
    en: {
        label: 'English',
        locale: 'en-US',
    },
};

export const sanitizeFileNamePart = (value) => {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9@._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

export const formatCurrencyForLanguage = (value, locale) => {
    const amount = Number(value || 0);
    return amount.toLocaleString(locale, {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
    });
};

export const formatDateForLanguage = (value, locale) => {
    if (!value) return '-';
    const parsedDate = moment(value, ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', moment.ISO_8601], true);
    if (!parsedDate.isValid()) return value;
    return locale === 'th-TH' ? parsedDate.format('DD/MM/YYYY') : parsedDate.format('MM/DD/YYYY');
};

const escapeCsvValue = (value) => {
    const str = String(value ?? '');
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const exportRowsToCsv = ({ rows, columns, fileName }) => {
    const headerLine = columns.map((column) => escapeCsvValue(column.header)).join(',');
    const dataLines = rows.map((row) => {
        return columns
            .map((column) => {
                const rawValue = row[column.key];
                const finalValue = typeof column.formatter === 'function'
                    ? column.formatter(rawValue, row)
                    : rawValue;
                return escapeCsvValue(finalValue);
            })
            .join(',');
    });

    const csv = ['\uFEFF' + headerLine, ...dataLines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
