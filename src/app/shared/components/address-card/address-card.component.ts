import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AddressDto } from '../../../features/user/services/address.service';

@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './address-card.component.html',
  styleUrl: './address-card.component.scss'
})
export class AddressCardComponent {
  @Input() address!: AddressDto;
  @Output() editClick = new EventEmitter<AddressDto>();
  @Output() deleteClick = new EventEmitter<AddressDto>();
}
