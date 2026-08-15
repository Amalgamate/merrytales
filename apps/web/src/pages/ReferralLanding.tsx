import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function ReferralLanding() {
  const { code } = useParams();
  const navigate = useNavigate();
  useEffect(() => { if (code && /^MT-[A-Z0-9]{6}$/i.test(code)) localStorage.setItem('merry_tales_referral_code', code.toUpperCase()); navigate('/create', { replace: true }); }, [code, navigate]);
  return null;
}
