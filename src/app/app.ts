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
  //esto lo eliminaremos previamente, es para fines de prueba. 
  mostrarConfirmacion = false;
  //ya fue modificado para que se guarde el paqueteId actual en una variable de clase
  paqueteIdActual: string | null = null;

  //propiedades para manejar la ubicación
  mostrarUbicacion = false;
  ubicacionEnProceso = false;

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

  if (respuesta?.mensaje) {
    this.mensajes.push(`Bot: ${respuesta.mensaje}`);
  } else {
    this.mensajes.push('Bot: n8n respondió, pero no llegó un mensaje.');
  }

  if (respuesta?.solicitarConfirmacion === true) {
    this.mostrarConfirmacion = true;
  }
  if (respuesta?.paqueteId) {
  this.paqueteIdActual = respuesta.paqueteId;
}

if (respuesta?.solicitarUbicacion === true) {
  this.mostrarUbicacion = true;
}

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

  // nuevos metodos para manejar la confirmación de entrega*
confirmarEntrega() {

  // Verificamos que exista un paquete seleccionado
  if (!this.paqueteIdActual) {
    this.mensajes.push(
      'Bot: No tengo un paquete seleccionado para confirmar la entrega.'
    );
    this.cdr.detectChanges();
    return;
  }

  this.mensajes.push('Tú: Sí, quiero recibirlo');
  this.mostrarConfirmacion = false;

  this.http.post<any>(
    'https://n8n.ozaru.app/webhook/consultar-paquete',
    {
      mensaje: 'Sí, quiero recibirlo',
      paqueteId: this.paqueteIdActual
    }
  ).subscribe({
    next: (respuesta) => {
      console.log('Confirmación:', respuesta);

      if (respuesta?.mensaje) {
        this.mensajes.push(`Bot: ${respuesta.mensaje}`);
      }

      if (respuesta?.paqueteId) {
        this.paqueteIdActual = respuesta.paqueteId;
      }

      if (respuesta?.solicitarUbicacion === true) {
        this.mostrarUbicacion = true;
      }

      this.cdr.detectChanges();
    },

    error: (error) => {
      console.error(error);
      this.mensajes.push(
        'Bot: Ocurrió un error al confirmar la entrega.'
      );
      this.cdr.detectChanges();
    }
  });
}

cancelarEntrega() {
  this.mensajes.push('Tú: No, gracias');
  this.mensajes.push(
    'Bot: Perfecto. No se realizará la entrega en este momento.'
  );

  this.mostrarConfirmacion = false;
  this.cdr.detectChanges();
}

//metodo para la ubicación
compartirUbicacion() {

  if (!this.paqueteIdActual) {
  this.mensajes.push(
    'Bot: No se encontró el ID del paquete para validar la ubicación.'
  );
  this.cdr.detectChanges();
  return;
}
  if (!navigator.geolocation) {
    this.mensajes.push(
      'Bot: Tu navegador no permite obtener la ubicación.'
    );
    this.cdr.detectChanges();
    return;
  }

  this.ubicacionEnProceso = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitud = position.coords.latitude;
      const longitud = position.coords.longitude;

      console.log('Latitud:', latitud);
      console.log('Longitud:', longitud);

      this.mensajes.push('Tú: Compartí mi ubicación actual.');

      this.http.post<any>(
        'https://n8n.ozaru.app/webhook/validar-ubicacion',
        {
          paqueteId: this.paqueteIdActual,
          latitud: latitud,
          longitud: longitud
        }
      ).subscribe({
        next: (respuesta) => {
          console.log('Validación ubicación:', respuesta);

          if (respuesta?.mensaje) {
            this.mensajes.push(`Bot: ${respuesta.mensaje}`);
          }

          this.mostrarUbicacion = false;
          this.ubicacionEnProceso = false;

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(error);

          this.mensajes.push(
            'Bot: Ocurrió un error al validar tu ubicación.'
          );

          this.ubicacionEnProceso = false;
          this.cdr.detectChanges();
        }
      });
    },

    (error) => {
  console.error('Error de geolocalización:', error);

  if (error.code === 1) {
    this.mensajes.push(
      'Bot: Debes permitir el acceso a tu ubicación para validar la entrega.'
    );
  } else if (error.code === 2) {
    this.mensajes.push(
      'Bot: No fue posible determinar tu ubicación actual.'
    );
  } else if (error.code === 3) {
    this.mensajes.push(
      'Bot: La ubicación está tardando demasiado. Intenta nuevamente.'
    );
  }

  this.ubicacionEnProceso = false;
  this.cdr.detectChanges();
},
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0
    }
  );
}
}