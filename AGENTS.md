# Instrucciones para Codex — Lab 13: Aplicación a la carrera

## Objetivo

Mantener un simulador web didáctico de ascensor con una persona sobre una balanza. La interfaz
está en español y muestra arranque, velocidad constante y frenado.

## Tecnología y estructura

Proyecto estático, sin dependencias. Abrir index.html directamente en un navegador moderno.

- index.html: estructura y etiquetas accesibles de la interfaz.
- styles.css: presentación adaptable y animación visual.
- physics.js: modelo físico puro; no accede al DOM, al reloj ni al almacenamiento.
- simulation.js: controlador de posición, velocidad, aceleración, fases y límites del recorrido.
- app.js: eventos, actualización visual y persistencia local.
- tests.cjs: verificaciones con Node.js de física, movimiento, interfaz y persistencia.
- README.md: instrucciones para abrir el simulador y repetir la demostración.

## Estilo del código

- En HTML, usar indentación que muestre la jerarquía.
- En CSS, poner una propiedad por línea.
- En JavaScript, escribir una instrucción por línea.
- Usar unos 100 caracteres como referencia de ancho y dividir expresiones largas donde sea natural.
- Separar física, control del movimiento, interfaz y persistencia.
- Nombrar las variables por su propósito y extraer funciones breves que aclaren el flujo.
- Evitar bloques compactados, decisiones mezcladas y ternarios anidados.

## Reglas físicas

- El sentido positivo es hacia arriba.
- g = 9,81 m/s².
- La balanza muestra N = m × (g + a), con aceleración instantánea y masa en kg.
- Al frenar, la aceleración tiene signo opuesto a la velocidad y la velocidad llega a cero sin
  invertir el sentido.
- La aceleración configurable va de 0,1 a 9,8 m/s² para conservar el contacto con la balanza.
- En reposo y a velocidad constante, la aceleración es cero y la lectura es m × g.
- La cabina empieza en el piso 03 y frena antes de los extremos del recorrido.
- Mantener posición y velocidad dentro de los límites. La física no debe depender de la interfaz.
- Modo lento escala a 0,25 el delta que recibe el controlador; no ralentizar solo la presentación.

## Datos recordados

Guardar la masa y la magnitud de aceleración en localStorage con la clave
lab13-elevador-ajustes-v1. Si falta un valor, está dañado, fuera de rango o el almacenamiento no
está disponible, usar 60 kg y 2 m/s². Al recargar, restaurar los ajustes y empezar en reposo.
Posición, velocidad y fase son temporales. Reiniciar devuelve la cabina al piso 03 y conserva los
ajustes.

## Ejecutar y verificar

- Ejecutar node tests.cjs desde la carpeta del proyecto.
- Antes de crear, modificar o ejecutar pruebas, consultar al usuario y esperar su respuesta.
- Imprimir DataFrames de Polars con print() y conservar su formato predeterminado si se usa Polars.
