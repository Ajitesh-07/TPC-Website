// Shared recruiter list used by both the Past Recruiters grid and the
// Trusted by Industry Leaders marquee. Logos are pulled by domain via Clearbit;
// swap `logo` with a local /public asset once official brand assets are available.
export const RECRUITERS = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Amazon', domain: 'amazon.com' },
  { name: 'Goldman Sachs', domain: 'goldmansachs.com' },
  { name: 'Qualcomm', domain: 'qualcomm.com' },
  { name: 'Texas Instruments', domain: 'ti.com' },
  { name: 'Adobe', domain: 'adobe.com' },
  { name: 'Intel', domain: 'intel.com' },
  { name: 'Samsung', domain: 'samsung.com' },
  { name: 'Oracle', domain: 'oracle.com' },
  { name: 'Deloitte', domain: 'deloitte.com' },
  { name: 'JPMorgan Chase', domain: 'jpmorganchase.com' },
  { name: 'Flipkart', domain: 'flipkart.com' },
  { name: 'Uber', domain: 'uber.com' },
  { name: 'Cisco', domain: 'cisco.com' },
  { name: 'Nvidia', domain: 'nvidia.com' },
];

export const logoUrl = (domain: string) => `https://logo.clearbit.com/${domain}`;
