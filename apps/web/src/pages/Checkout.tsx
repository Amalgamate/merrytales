import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Smartphone, Lock, ChevronLeft, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function Checkout() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState({ recipientName: '', recipientPhone: '', recipientEmail: '', county: 'Nairobi', addressLine: '', landmark: '', instructions: '', method: 'COURIER' });
  // TODO: fetch from /api/orders/delivery-fees — server-side fee is authoritative at order creation
  const deliveryFee = ({ Nairobi: 500, Kiambu: 700, Mombasa: 1200 } as Record<string, number>)[delivery.county] ?? 1000;
  const payableTotal = total + (delivery.method === 'CUSTOMER_PICKUP' ? 0 : deliveryFee);
  
  const handleNext = async () => {
    setError('');
    if (step < 3) {
      if (step === 1) { if (!user) { navigate('/login', { state: { from: '/checkout' } }); return; } if (!delivery.recipientName || !delivery.recipientPhone || !delivery.addressLine) { setError('Add the recipient, phone number and delivery address.'); return; } setPhone(delivery.recipientPhone); setStep(2); return; }
      if (!items.length || !phone) { setError('Add an item and enter your M-Pesa phone number.'); return; }
      setSubmitting(true);
      try {
        const order = orderId
          ? { id: orderId, orderNumber }
          : await apiRequest<{ id: string; orderNumber: string }>('/orders', { method: 'POST', body: JSON.stringify({ items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })), delivery: { ...delivery, recipientEmail: delivery.recipientEmail || undefined, landmark: delivery.landmark || undefined, instructions: delivery.instructions || undefined } }) });
        if (!orderId) { setOrderId(order.id); setOrderNumber(order.orderNumber); }
        try { await apiRequest('/payments/mpesa/stk', { method: 'POST', body: JSON.stringify({ orderId: order.id, phone }) }); }
        catch (paymentError) { setError(paymentError instanceof Error ? paymentError.message : 'Order created, but payment could not start.'); return; }
        clear(); setStep(3);
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create your order.'); }
      finally { setSubmitting(false); }
    } else {
      navigate('/app/orders'); // Redirect to orders after successful payment
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center mb-8 pt-4">
          <Link to="/cart" className="text-gray-500 hover:text-primary font-semibold flex items-center">
            <ChevronLeft className="h-5 w-5 mr-1" /> Back to Cart
          </Link>
        </div>

        {/* Checkout Progress */}
        <div className="flex items-center justify-between mb-12 relative max-w-2xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
          
          <div className="flex flex-col items-center bg-gray-50 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 mb-2 ${step >= 1 ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'}`}>1</div>
            <span className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>Details</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 mb-2 ${step >= 2 ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'}`}>2</div>
            <span className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>Payment</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 mb-2 ${step >= 3 ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'}`}>3</div>
            <span className={`text-xs font-bold uppercase tracking-wider ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>Complete</span>
          </div>
        </div>

        <div className="bg-white rounded-[30px] border border-border-soft shadow-sm overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Checkout Form */}
          <div className="w-full md:w-2/3 p-6 md:p-10 border-b md:border-b-0 md:border-r border-gray-100">
            
            {step === 1 && (
              <div className="animate-in fade-in">
                <h2 className="text-2xl font-bold mb-6">Contact & Delivery</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">First Name</label>
                      <Input placeholder="John Kamau" value={delivery.recipientName} onChange={(event) => setDelivery({ ...delivery, recipientName: event.target.value })} className="h-12 bg-gray-50 border-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Last Name</label>
                      <Input value={user ? `${user.firstName} ${user.lastName}` : ''} disabled className="h-12 bg-gray-100 border-gray-200" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Email (For digital delivery)</label>
                      <Input placeholder="john@example.com" type="email" value={delivery.recipientEmail} onChange={(event) => setDelivery({ ...delivery, recipientEmail: event.target.value })} className="h-12 bg-gray-50 border-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Phone (For M-Pesa & Courier)</label>
                      <Input placeholder="07XX XXX XXX" value={delivery.recipientPhone} onChange={(event) => setDelivery({ ...delivery, recipientPhone: event.target.value })} className="h-12 bg-gray-50 border-gray-200" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-lg mb-4">Delivery Address (For physical items)</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">County / City</label>
                        <select value={delivery.county} onChange={(event) => setDelivery({ ...delivery, county: event.target.value })} className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none">
                          <option>Nairobi</option>
                          <option>Mombasa</option>
                          <option>Kiambu</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Building, Estate or Street</label>
                        <Input placeholder="E.g. Westlands Commercial Center" value={delivery.addressLine} onChange={(event) => setDelivery({ ...delivery, addressLine: event.target.value })} className="h-12 bg-gray-50 border-gray-200" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-sm font-bold text-gray-700">Landmark</label><Input placeholder="Near Sarit Centre" value={delivery.landmark} onChange={(event) => setDelivery({ ...delivery, landmark: event.target.value })} className="h-12 bg-gray-50 border-gray-200" /></div><div className="space-y-2"><label className="text-sm font-bold text-gray-700">Handoff</label><select value={delivery.method} onChange={(event) => setDelivery({ ...delivery, method: event.target.value })} className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-md"><option value="COURIER">Merry Tales courier</option><option value="CUSTOMER_PICKUP">I will collect</option></select></div></div>
                      <div className="space-y-2"><label className="text-sm font-bold text-gray-700">Delivery instructions</label><textarea placeholder="Gate, floor, access or preferred handoff notes" value={delivery.instructions} onChange={(event) => setDelivery({ ...delivery, instructions: event.target.value })} className="w-full min-h-20 rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm" /></div>
                      <div className="grid sm:grid-cols-3 gap-3 pt-2">{[[MapPin,'Address saved','Used only for fulfilment'],[Truck,'Split delivery','Each seller tracks separately'],[ShieldCheck,'PIN handoff','Share PIN only at delivery']].map(([Icon,label,detail])=><div key={String(label)} className="rounded-xl border bg-white p-3"><Icon className="h-4 w-4 text-primary mb-2"/><p className="text-xs font-bold">{label as string}</p><p className="text-[11px] text-gray-500">{detail as string}</p></div>)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                
                <div className="space-y-4">
                  {/* M-Pesa Option */}
                  <div className="border-2 border-green-500 bg-green-50 rounded-2xl p-4 flex items-start cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">Recommended</div>
                    <div className="mt-1 mr-4">
                      <div className="w-5 h-5 rounded-full border-4 border-green-500 bg-white"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <Smartphone className="h-5 w-5 text-green-700 mr-2" />
                        <h3 className="font-bold text-green-900">M-Pesa Express</h3>
                      </div>
                      <p className="text-sm text-green-800 mb-4">A payment prompt will be sent to your phone automatically.</p>
                      <div className="bg-white rounded-xl p-3 border border-green-200">
                        <label className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1 block">M-Pesa Phone Number</label>
                        <Input placeholder="2547XXXXXXXX" value={phone} onChange={(event) => setPhone(event.target.value)} className="border-0 shadow-none px-0 font-bold text-lg focus-visible:ring-0 h-8" />
                      </div>
                    </div>
                  </div>

                  {/* Card Option */}
                  <div className="border-2 border-gray-200 rounded-2xl p-4 flex items-start cursor-pointer hover:border-gray-300">
                    <div className="mt-1 mr-4">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="font-bold text-gray-700">Credit / Debit Card</h3>
                      </div>
                      <p className="text-sm text-gray-500">Pay securely with Visa or Mastercard.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in text-center py-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-extrabold mb-4">Order Confirmed!</h2>
                <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
                <p className="text-gray-600 mb-8">Your order #<strong className="text-primary font-mono">{orderNumber}</strong> has been placed. Complete the M-Pesa prompt on your phone.</p>
                <div className="bg-gray-50 rounded-2xl p-6 inline-block text-left mb-8">
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">What happens next?</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start"><Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" /> Digital items are now available in your workspace.</li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" /> Physical items have entered the production queue.</li>
                  </ul>
                </div>
              </div>
            )}

            {error && <div role="alert" className="mt-6 rounded-xl bg-red-50 text-red-700 p-4 text-sm">{error}</div>}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              {step > 1 && step < 3 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)} className="font-bold">
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button disabled={submitting} onClick={() => void handleNext()} className="rounded-full px-8 py-6 font-bold shadow-soft">
                {step === 1 && 'Continue to Payment'}
                {step === 2 && (
                  <span className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" /> {submitting ? 'Starting payment…' : `Pay KES ${payableTotal.toLocaleString()}`}
                  </span>
                )}
                {step === 3 && 'Go to My Orders'}
              </Button>
            </div>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="w-full md:w-1/3 bg-gray-50 p-6 md:p-8">
            <h3 className="font-bold text-lg mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6">
              {items.map((item) => <div key={item.productId} className="flex items-center text-sm">
                <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 mr-3 flex items-center justify-center font-bold text-gray-500">{item.quantity}</div>
                <div className="flex-1 font-medium pr-2">{item.name}</div>
                <div className="font-bold">{(item.price * item.quantity).toLocaleString()}</div>
              </div>)}
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery to {delivery.county}</span>
                <span>{delivery.method === 'CUSTOMER_PICKUP' ? 'Free pickup' : deliveryFee.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-gray-200 pt-4">
              <span className="font-bold">Total</span>
              <span className="text-xl font-extrabold text-primary">KES {(delivery.method === 'CUSTOMER_PICKUP' ? total : payableTotal).toLocaleString()}</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
