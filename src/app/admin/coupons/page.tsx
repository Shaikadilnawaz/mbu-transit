'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, BadgePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminShell } from '@/components/layout/admin-shell';
import { useToast } from '@/hooks/use-toast';
import { subscribeOffers, createOffer, deleteOffer, setOfferActive } from '@/lib/db';
import type { Offer } from '@/lib/types';

function MainContent() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeOffers(setOffers);
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseInt(value, 10);
    if (!code.trim() || !title.trim() || Number.isNaN(v) || v <= 0) {
      toast({ variant: 'destructive', title: 'Fill in all fields', description: 'Code, title and a positive value are required.' });
      return;
    }
    setSaving(true);
    try {
      await createOffer({ code, title, discountType, value: v });
      setCode('');
      setTitle('');
      setValue('');
      toast({ title: 'Coupon added' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not add coupon', description: err instanceof Error ? err.message : 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgePercent className="h-5 w-5" /> Add a Coupon
          </CardTitle>
          <CardDescription>Only admins can create coupon codes. They appear on students&apos; dashboards.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="AUTO20" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="20% off auto rides" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Discount</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percent' | 'flat')}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="flat">Flat (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} placeholder={discountType === 'percent' ? '20' : '10'} />
            </div>
            <Button type="submit" disabled={saving} className="lg:col-span-5 lg:w-auto lg:justify-self-start">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Coupon
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
          <CardDescription>{offers.length} coupon{offers.length === 1 ? '' : 's'}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No coupons yet. Add one above.
                  </TableCell>
                </TableRow>
              )}
              {offers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono font-medium">{o.code}</TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell>{o.discountType === 'percent' ? `${o.value}% off` : `₹${o.value} off`}</TableCell>
                  <TableCell>
                    <Badge className={o.active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}>
                      {o.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setOfferActive(o.id, !o.active)}>
                        {o.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="outline" size="icon" className="text-red-600" onClick={() => deleteOffer(o.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCouponsPage() {
  return (
    <AdminShell>
      <MainContent />
    </AdminShell>
  );
}
