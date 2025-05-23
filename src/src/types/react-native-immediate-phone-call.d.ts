declare module 'react-native-immediate-phone-call' {
  export interface ImmediatePhoneCallOptions {
    prompt?: boolean; 
  }

  export function immediatePhoneCall(phoneNumber: string, options?: ImmediatePhoneCallOptions): void;
}
