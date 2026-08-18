import { useState, useEffect } from 'react';
import { Calendar, MapPin, Edit3, Heart, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface Event {
  id: string;
  title: string;
  partnerOne?: string;
  partnerTwo?: string;
  eventDate?: string;
  city?: string;
  venue?: string;
  budget?: number;
  guestTarget?: number;
}

interface Guest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  household?: string;
  attending?: boolean | null;
  plusOnes: number;
}

interface GuestFormData {
  name: string;
  phone: string;
  email: string;
  household: string;
  attending: 'pending' | 'attending' | 'declined';
  plusOnes: number;
}

interface EventFormData {
  title: string;
  eventDate: string;
  venue: string;
  city: string;
  budget: string;
  guestTarget: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function attendingLabel(attending?: boolean | null): string {
  if (attending === true) return 'Attending';
  if (attending === false) return 'Declined';
  return 'Pending';
}

function attendingValue(attending?: boolean | null): GuestFormData['attending'] {
  if (attending === true) return 'attending';
  if (attending === false) return 'declined';
  return 'pending';
}

function attendingBool(val: GuestFormData['attending']): boolean | null {
  if (val === 'attending') return true;
  if (val === 'declined') return false;
  return null;
}

function daysToGo(eventDate?: string): number | null {
  if (!eventDate) return null;
  const diff = new Date(eventDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Empty form state ─────────────────────────────────────────────────────────

const emptyGuestForm = (): GuestFormData => ({
  name: '', phone: '', email: '', household: '', attending: 'pending', plusOnes: 0,
});

// ── Component ────────────────────────────────────────────────────────────────

export function WeddingOverview() {
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Guest modal state
  const [guestModal, setGuestModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    guest?: Guest;
  }>({ open: false, mode: 'add' });
  const [guestForm, setGuestForm] = useState<GuestFormData>(emptyGuestForm());
  const [guestSaving, setGuestSaving] = useState(false);
  const [guestFormError, setGuestFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Edit event modal state
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: '', eventDate: '', venue: '', city: '', budget: '', guestTarget: '',
  });
  const [eventSaving, setEventSaving] = useState(false);
  const [eventFormError, setEventFormError] = useState<string | null>(null);

  // 1. Load first event on mount
  useEffect(() => {
    setLoadingEvent(true);
    setEventError(null);
    apiRequest<Event[]>('/events')
      .then(events => {
        if (events.length) setEvent(events[0]);
        else setEventError('No events found. Create your first event to get started.');
      })
      .catch(err => setEventError(err?.message ?? 'Failed to load event.'))
      .finally(() => setLoadingEvent(false));
  }, []);

  // 2. Load guests when event changes
  useEffect(() => {
    if (!event) return;
    setLoadingGuests(true);
    setGuestError(null);
    apiRequest<Guest[]>(`/events/${event.id}/guests`)
      .then(setGuests)
      .catch(err => setGuestError(err?.message ?? 'Failed to load guests.'))
      .finally(() => setLoadingGuests(false));
  }, [event?.id]);

  // ── Computed stats ──────────────────────────────────────────────────────────

  const days = daysToGo(event?.eventDate);
  const rsvpsReceived = guests.filter(g => g.attending !== null && g.attending !== undefined).length;
  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.household ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Guest modal helpers ─────────────────────────────────────────────────────

  function openAddGuest() {
    setGuestForm(emptyGuestForm());
    setGuestFormError(null);
    setDeleteConfirm(false);
    setGuestModal({ open: true, mode: 'add' });
  }

  function openEditGuest(g: Guest) {
    setGuestForm({
      name: g.name,
      phone: g.phone ?? '',
      email: g.email ?? '',
      household: g.household ?? '',
      attending: attendingValue(g.attending),
      plusOnes: g.plusOnes,
    });
    setGuestFormError(null);
    setDeleteConfirm(false);
    setGuestModal({ open: true, mode: 'edit', guest: g });
  }

  function closeGuestModal() {
    setGuestModal({ open: false, mode: 'add' });
    setDeleteConfirm(false);
  }

  async function submitGuestForm() {
    if (!event) return;
    if (!guestForm.name.trim()) {
      setGuestFormError('Name is required.');
      return;
    }
    setGuestSaving(true);
    setGuestFormError(null);
    const payload = {
      name: guestForm.name.trim(),
      phone: guestForm.phone.trim() || undefined,
      email: guestForm.email.trim() || undefined,
      household: guestForm.household.trim() || undefined,
      attending: attendingBool(guestForm.attending),
      plusOnes: guestForm.plusOnes,
    };
    try {
      if (guestModal.mode === 'add') {
        await apiRequest<Guest>(`/events/${event.id}/guests`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else if (guestModal.guest) {
        await apiRequest<Guest>(`/events/${event.id}/guests/${guestModal.guest.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      const updated = await apiRequest<Guest[]>(`/events/${event.id}/guests`);
      setGuests(updated);
      closeGuestModal();
    } catch (err: unknown) {
      setGuestFormError((err as { message?: string })?.message ?? 'Failed to save guest.');
    } finally {
      setGuestSaving(false);
    }
  }

  async function deleteGuest() {
    if (!event || !guestModal.guest) return;
    setGuestSaving(true);
    setGuestFormError(null);
    try {
      await apiRequest(`/events/${event.id}/guests/${guestModal.guest.id}`, { method: 'DELETE' });
      const updated = await apiRequest<Guest[]>(`/events/${event.id}/guests`);
      setGuests(updated);
      closeGuestModal();
    } catch (err: unknown) {
      setGuestFormError((err as { message?: string })?.message ?? 'Failed to delete guest.');
    } finally {
      setGuestSaving(false);
      setDeleteConfirm(false);
    }
  }

  // ── Edit event modal helpers ────────────────────────────────────────────────

  function openEditEvent() {
    if (!event) return;
    setEventForm({
      title: event.title ?? '',
      eventDate: event.eventDate ? event.eventDate.slice(0, 10) : '',
      venue: event.venue ?? '',
      city: event.city ?? '',
      budget: event.budget != null ? String(event.budget) : '',
      guestTarget: event.guestTarget != null ? String(event.guestTarget) : '',
    });
    setEventFormError(null);
    setEditEventOpen(true);
  }

  async function submitEventForm() {
    if (!event) return;
    if (!eventForm.title.trim()) {
      setEventFormError('Title is required.');
      return;
    }
    setEventSaving(true);
    setEventFormError(null);
    const payload: Partial<Event> = {
      title: eventForm.title.trim(),
      eventDate: eventForm.eventDate || undefined,
      venue: eventForm.venue.trim() || undefined,
      city: eventForm.city.trim() || undefined,
      budget: eventForm.budget ? Number(eventForm.budget) : undefined,
      guestTarget: eventForm.guestTarget ? Number(eventForm.guestTarget) : undefined,
    };
    try {
      const updated = await apiRequest<Event>(`/events/${event.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEvent(updated);
      setEditEventOpen(false);
    } catch (err: unknown) {
      setEventFormError((err as { message?: string })?.message ?? 'Failed to update event.');
    } finally {
      setEventSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventError && !event) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-gray-600">{eventError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold mb-1">{event?.title ?? 'My Wedding'}</h1>
          <p className="text-gray-500">
            {event?.partnerOne && event?.partnerTwo
              ? `${event.partnerOne} & ${event.partnerTwo}`
              : 'Manage your event details, guests, and timeline.'}
          </p>
        </div>
        <Button className="rounded-full shadow-soft" onClick={openEditEvent}>
          <Edit3 className="h-4 w-4 mr-2" /> Edit Details
        </Button>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border-soft shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Days To Go</p>
          <h3 className="text-3xl font-extrabold text-foreground">
            {days != null ? (days >= 0 ? days : 0) : '—'}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border-soft shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Invited Guests</p>
          <h3 className="text-3xl font-extrabold text-foreground">{guests.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border-soft shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">RSVPs Received</p>
          <h3 className="text-3xl font-extrabold text-green-600">{rsvpsReceived}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-border-soft shadow-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Guest Target</p>
          <h3 className="text-3xl font-extrabold text-primary">
            {event?.guestTarget ?? '—'}
          </h3>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-3xl border border-border-soft shadow-sm overflow-hidden">
        <Tabs defaultValue="details" className="w-full">
          <div className="px-6 pt-6 border-b border-border-soft">
            <TabsList className="bg-transparent h-auto p-0 flex-wrap justify-start gap-6">
              <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base">Event Details</TabsTrigger>
              <TabsTrigger value="guests" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base">Guest List</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base">Timeline</TabsTrigger>
              <TabsTrigger value="vendors" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base">My Vendors</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 md:p-8">

            {/* ── Details Tab ── */}
            <TabsContent value="details" className="space-y-8 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" /> Date & Location
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                    <p className="font-bold text-foreground">{formatDate(event?.eventDate)}</p>
                    {event?.city && <p className="text-sm text-gray-500">{event.city}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-primary" /> Venue
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="font-bold text-foreground mb-1">{event?.venue ?? '—'}</p>
                    {event?.city && <p className="text-sm text-gray-500">{event.city}</p>}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border-soft">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-primary" /> Budget
                </h3>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 inline-block min-w-[180px]">
                  <p className="text-sm text-gray-500 font-semibold mb-1">Estimated Budget</p>
                  <p className="font-bold text-xl text-foreground">
                    {event?.budget != null ? `KES ${event.budget.toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Guest List Tab ── */}
            <TabsContent value="guests" className="mt-0">
              <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <div className="relative max-w-sm w-full">
                  <Input
                    placeholder="Search guests..."
                    className="rounded-full bg-gray-50 border-gray-200 pl-4 h-10"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Button className="rounded-full" onClick={openAddGuest}>
                  <Plus className="h-4 w-4 mr-1" /> Add Guest
                </Button>
              </div>

              {guestError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {guestError}
                </div>
              )}

              {loadingGuests ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-soft">
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Household</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">RSVP Status</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plus Ones</th>
                        <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGuests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                            {guests.length === 0 ? 'No guests yet. Add your first guest!' : 'No guests match your search.'}
                          </td>
                        </tr>
                      ) : (
                        filteredGuests.map((guest) => {
                          const label = attendingLabel(guest.attending);
                          return (
                            <tr key={guest.id} className="border-b border-border-soft hover:bg-gray-50/50">
                              <td className="py-4 px-4 font-semibold">{guest.name}</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{guest.household ?? '—'}</td>
                              <td className="py-4 px-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  label === 'Attending' ? 'bg-green-100 text-green-700' :
                                  label === 'Declined' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {label}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">{guest.plusOnes}</td>
                              <td className="py-4 px-4 text-right">
                                <button
                                  className="text-sm text-primary font-semibold hover:underline"
                                  onClick={() => openEditGuest(guest)}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── Timeline Tab ── */}
            <TabsContent value="timeline" className="mt-0">
              <div className="text-center py-12">
                <h3 className="text-xl font-bold mb-2">Timeline Builder Coming Soon</h3>
                <p className="text-gray-500 mb-6">Create a detailed schedule for your wedding day.</p>
                <Button variant="outline" className="rounded-full">Get Notified</Button>
              </div>
            </TabsContent>

            {/* ── Vendors Tab ── */}
            <TabsContent value="vendors" className="mt-0">
              <div className="text-center py-12">
                <h3 className="text-xl font-bold mb-2">No vendors booked yet</h3>
                <p className="text-gray-500 mb-6">Explore the marketplace to find your perfect team.</p>
                <Button className="rounded-full">Explore Vendors</Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* ── Guest Modal ── */}
      {guestModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeGuestModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-5">
              {guestModal.mode === 'add' ? 'Add Guest' : 'Edit Guest'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <Input
                  value={guestForm.name}
                  onChange={e => setGuestForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <Input
                    value={guestForm.phone}
                    onChange={e => setGuestForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+254..."
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <Input
                    value={guestForm.email}
                    onChange={e => setGuestForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Household</label>
                <Input
                  value={guestForm.household}
                  onChange={e => setGuestForm(f => ({ ...f, household: e.target.value }))}
                  placeholder="Family / group name"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">RSVP Status</label>
                  <select
                    value={guestForm.attending}
                    onChange={e => setGuestForm(f => ({ ...f, attending: e.target.value as GuestFormData['attending'] }))}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="attending">Attending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plus Ones</label>
                  <Input
                    type="number"
                    min={0}
                    value={guestForm.plusOnes}
                    onChange={e => setGuestForm(f => ({ ...f, plusOnes: Math.max(0, Number(e.target.value)) }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {guestFormError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {guestFormError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6 gap-3">
              {guestModal.mode === 'edit' && (
                <div>
                  {deleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                      <button
                        className="text-sm text-red-600 font-bold hover:underline"
                        onClick={deleteGuest}
                        disabled={guestSaving}
                      >
                        {guestSaving ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Delete'}
                      </button>
                      <button
                        className="text-sm text-gray-500 hover:underline"
                        onClick={() => setDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-sm text-red-500 font-semibold hover:text-red-700"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      Delete Guest
                    </button>
                  )}
                </div>
              )}
              <div className={`flex gap-3 ${guestModal.mode === 'add' ? 'ml-auto' : ''}`}>
                <Button variant="outline" className="rounded-full" onClick={closeGuestModal} disabled={guestSaving}>
                  Cancel
                </Button>
                <Button className="rounded-full" onClick={submitGuestForm} disabled={guestSaving}>
                  {guestSaving
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    : null}
                  {guestModal.mode === 'add' ? 'Add Guest' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Event Modal ── */}
      {editEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setEditEventOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-5">Edit Event Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title <span className="text-red-500">*</span></label>
                <Input
                  value={eventForm.title}
                  onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Alice & Bob's Wedding"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date</label>
                <Input
                  type="date"
                  value={eventForm.eventDate}
                  onChange={e => setEventForm(f => ({ ...f, eventDate: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Venue</label>
                <Input
                  value={eventForm.venue}
                  onChange={e => setEventForm(f => ({ ...f, venue: e.target.value }))}
                  placeholder="Venue name"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <Input
                  value={eventForm.city}
                  onChange={e => setEventForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="City"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Budget (KES)</label>
                  <Input
                    type="number"
                    min={0}
                    value={eventForm.budget}
                    onChange={e => setEventForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="0"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Guest Target</label>
                  <Input
                    type="number"
                    min={0}
                    value={eventForm.guestTarget}
                    onChange={e => setEventForm(f => ({ ...f, guestTarget: e.target.value }))}
                    placeholder="0"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {eventFormError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-3 py-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {eventFormError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" className="rounded-full" onClick={() => setEditEventOpen(false)} disabled={eventSaving}>
                Cancel
              </Button>
              <Button className="rounded-full" onClick={submitEventForm} disabled={eventSaving}>
                {eventSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
