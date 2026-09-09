import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  mensaje = '';
  mensajes: string[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  enviarMensaje() {

    if (!this.mensaje.trim()) return;

    const mensajeUsuario = this.mensaje;

    this.mensajes.push(`Tú: ${mensajeUsuario}`);

    this.http.post<any>(
      'https://n8n.ozaru.app/webhook/consultar-paquete',
      {
        mensaje: mensajeUsuario
      }
    ).subscribe({

      next: (respuesta) => {

        console.log('Respuesta de n8n:', respuesta);

        if (respuesta && respuesta.mensaje) {

          this.mensajes.push(
            `Bot: ${respuesta.mensaje}`
          );

        } else {

          this.mensajes.push(
            'Bot: n8n respondió, pero no llegó un mensaje.'
          );

        }

        // Le avisamos a Angular que refresque la vista
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(error);

        this.mensajes.push(
          'Bot: Ocurrió un error al consultar el paquete.'
        );

        this.cdr.detectChanges();
      }

    });

    this.mensaje = '';
  }
}