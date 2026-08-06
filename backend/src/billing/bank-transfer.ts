import { randomBytes } from 'crypto';

/**
 * Bank-transfer (havale/EFT) collection details and reference codes.
 *
 * Account details come from env rather than the database: they are deployment
 * configuration, they change roughly never, and keeping them out of the schema
 * means a database dump does not carry the company's banking details.
 */

export interface BankAccountDetails {
  bankName: string;
  accountHolder: string;
  iban: string;
  /** Shown under the IBAN so a customer can sanity-check before sending. */
  currency: 'TRY';
  /** Present only when the deployment has not filled the env in yet. */
  configured: boolean;
  instructions: string[];
}

export function bankAccountDetails(): BankAccountDetails {
  const iban = (process.env.BANK_IBAN ?? '').trim();
  const bankName = (process.env.BANK_NAME ?? '').trim();
  const accountHolder = (process.env.BANK_ACCOUNT_HOLDER ?? '').trim();

  return {
    bankName: bankName || 'Banka bilgisi tanımlanmadı',
    accountHolder: accountHolder || 'Hesap sahibi tanımlanmadı',
    iban: iban || '',
    currency: 'TRY',
    configured: Boolean(iban && bankName && accountHolder),
    instructions: [
      'Tutarı yukarıdaki IBAN’a havale veya EFT ile gönderin.',
      'Açıklama alanına referans kodunuzu **birebir** yazın — eşleştirme bu kodla yapılır.',
      'Ödemeniz mesai saatleri içinde genellikle birkaç saat içinde onaylanır.',
      'Onaylandığında e-posta ile bilgilendirilir ve bakiyeniz otomatik tanımlanır.',
    ],
  };
}

/**
 * Alphabet without look-alike characters (no 0/O, 1/I/L, 2/Z, 5/S, 8/B).
 * A customer retypes this code into a banking app by hand, and a single
 * misread character means an unmatched payment and a support ticket.
 */
const CODE_ALPHABET = '34679ACDEFGHJKMNPQRTUVWXY';

/** e.g. `BP-7K4MQD` — short enough to retype, wide enough to not collide. */
export function generateReferenceCode(): string {
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `BP-${code}`;
}

/** How long a quoted price is held before the request is treated as abandoned. */
export const PAYMENT_REQUEST_TTL_DAYS = 7;
