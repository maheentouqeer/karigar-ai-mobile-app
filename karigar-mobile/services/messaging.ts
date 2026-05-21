import { Linking, Platform } from 'react-native';

/**
 * Utility for triggering external messaging (SMS/WhatsApp).
 * Common in Pakistan for direct communication.
 */

export const sendSMS = async (phone: string, message: string) => {
  const url = `sms:${phone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    console.warn('SMS not supported');
  }
};

export const sendWhatsApp = async (phone: string, message: string) => {
  // Normalize phone (remove leading 0, ensure +92)
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('92')) {
    cleanPhone = '92' + cleanPhone;
  }
  
  const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web link
      await Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
    }
  } catch (e) {
    console.warn('WhatsApp error:', e);
    // Final fallback
    await Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`);
  }
};
