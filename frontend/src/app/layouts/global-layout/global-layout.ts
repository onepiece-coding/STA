import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalHeader } from '../../components/global-nav/global-header';

@Component({
  selector: 'app-global-layout',
  imports: [RouterOutlet, GlobalHeader],
  templateUrl: './global-layout.html',
  styleUrl: './global-layout.scss',
})
export class GlobalLayout {}
