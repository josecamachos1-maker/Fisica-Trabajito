# Simulador de ascensor — Lab 13

Simulador web para observar la fuerza normal que marca una balanza durante el movimiento de un
ascensor. No necesita instalar dependencias.

## Abrir

Abre index.html en un navegador moderno. Los ajustes de masa y aceleración se guardan en el
almacenamiento local de ese navegador.

## Demostración

1. Deja la masa en 60 kg y la aceleración en 2 m/s². En reposo, marca 588,6 N.
2. Pulsa **Subir**. Al acelerar, marca 708,6 N; al llegar a velocidad constante, vuelve a
   588,6 N.
3. Pulsa **Detener** mientras sube. Durante el frenado, la aceleración es −2 m/s² y la balanza
   marca 468,6 N mientras la cabina todavía asciende.
4. Repite con **Bajar**. **Reiniciar** devuelve la cabina al piso 03 y conserva los ajustes.
5. Cambia la masa o aceleración y recarga la página para comprobar que se recuerdan los valores.
6. Activa **Modo lento ×0,25** para ver el mismo recorrido a un cuarto de velocidad.

El ascensor también frena automáticamente antes de los límites del recorrido.

## Verificación automatizada

Con Node.js instalado, ejecuta node tests.cjs desde esta carpeta. Comprueba la física, los
controles, el frenado manual y automático, los límites, el reinicio y la persistencia.
