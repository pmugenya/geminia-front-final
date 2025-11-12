import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { QuoteService } from '../../../core/services/quote.service';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotesData } from '../../../core/user/user.types';


@Component({
    selector: 'app-quote-details',
    standalone: true,
    templateUrl: './view-quote.html',
    providers: [DatePipe],
    imports: [
        MatIcon,
        NgClass,
        DatePipe,
        CurrencyPipe,
        CommonModule
    ],
})
export class ViewQuote implements OnInit {
    /** Input from parent component or route resolver */
    quote?: QuotesData;
    quoteId!: string;


    constructor(private datePipe: DatePipe,
                private quoteService: QuoteService,
                private route: ActivatedRoute,
                private router: Router,) {}

    ngOnInit(): void {
        this.quoteId = this.route.snapshot.paramMap.get('quoteId')!;
        this.quoteService.getQuoteById(this.quoteId!).subscribe({
            next: (data) => {
                console.log(data);
                this.quote = data;
            },
            error: (err) => {
                console.error('Error fetching transaction:', err);
            }
        });
    }

    /** Helper for formatting date */
    formatDate(date: string): string {
        return this.datePipe.transform(date, 'mediumDate') || '';
    }

    /** Helper to style status badge */
    getStatusColor(status: string): string {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'expired':
                return 'bg-red-100 text-red-700';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'draft':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-blue-100 text-blue-700';
        }
    }

    /** Check if quote is close to expiry */
    isExpiringSoon(expiryDate: string): boolean {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diff = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diff <= 30;
    }

    /** Action handlers */
    downloadQuote(): void {
        console.log('Downloading quote:', this.quote.refno);
        // Implement actual file download here (e.g., call API endpoint)
    }

    buyNow(): void {
        console.log('Proceed to purchase for quote:', this.quote.refno);
        // Navigate to payment or checkout page
    }

    contactSupport(): void {
        console.log('Contacting support for quote:', this.quote.refno);
        // Open support dialog or redirect
    }
}
