# Comparativa de kpi

## Gestión eficiente de componentes

## Buenas Prácticas

```
● Lógica delegada: El componente DetailPage es ligero. Delega la obtención de datos
al SocialBadService y la transformación visual es mínima.
● Funciones ligeras: La función prettyEmail en detail.page.ts es simple (return
email.toLowerCase()), lo que no penaliza el ciclo de detección de cambios.
```
## Malas Prácticas

```
● Lógica en el componente: DetailPage contiene lógica innecesaria en el ngOnInit para
manipular los datos (bucle for que infla la lista a 500 elementos), bloqueando el
renderizado inicial.
● Cálculos pesados en template: La función prettyEmail incluye un bucle costoso (for
(let i = 0; i < 6000; i++)). Al usarse directamente en el HTML ({{ prettyEmail(c.email)
}}), Angular la ejecuta docenas de veces por segundo durante la detección de
cambios, congelando la interfaz.
```
## Lazy loading de páginas y componentes

## Buenas Prácticas

```
● Lazy Loading con Precarga (Preloading): Las rutas se definen con loadComponent
en app.routes.ts, lo que asegura que el paquete inicial de la aplicación sea pequeño.
Además, en app.config.ts se ha configurado la estrategia
withPreloading(PreloadAllModules). Esto instruye a Angular para que, una vez que la
aplicación inicial esté cargada, descargue en segundo plano los módulos de las
otras páginas (detail, settings).
● Impacto: El tiempo de arranque es muy rápido. Cuando el usuario navega a otra
página, la transición es casi instantánea porque el código ya ha sido descargado,
mejorando significativamente la percepción de fluidez.
```

### Malas Prácticas

```
● Lazy Loading Básico: Utiliza loadComponent en app.routes.ts, por lo que
técnicamente las páginas se cargan de forma perezosa. Sin embargo, no tiene una
estrategia de precarga configurada.
● Impacto: Aunque el arranque inicial se beneficia del lazy loading, cada vez que el
usuario navega a una nueva página por primera vez, debe esperar a que el
navegador descargue y analice el archivo JavaScript correspondiente. Esta espera,
combinada con el pobre rendimiento de los componentes en la aplicación sin
optimizar, resulta en una experiencia de usuario lenta y con tirones.
```
## Uso correcto de servicios y estado compartido

### Buenas Prácticas

```
● Servicio con Estado (Singleton): SocialBadService actúa como una fuente de verdad
única. Utiliza variables privadas (postsCache$, commentsCache) para mantener el
estado.
● Gestión de memoria: Implementa un mecanismo de limpieza (TTL) con setTimeout
para liberar la memoria de la caché después de 60 segundos.
```
### Malas Prácticas

```
● Servicio "Pasamanos": SocialBadService no mantiene estado; simplemente
devuelve una nueva petición HTTP cada vez que se le llama. Esto provoca
inconsistencias y redundancia de datos.
● Fugas de memoria: Al no gestionar el estado ni las suscripciones, los datos se
acumulan en la memoria del navegador sin control cada vez que se navega.
```
## Uso eficiente de componentes Ionic

### Buenas Prácticas

```
● Utiliza <ion-list> e <ion-item> de forma estándar, aprovechando la optimización
nativa de Ionic para listas de tamaño razonable.
```
### Malas Prácticas

Aunque usa los mismos componentes visuales, abusa de ellos renderizando 500 <ion-item>
simultáneamente sin virtualización (virtual scroll), lo que satura el DOM y hace que las
animaciones de Ionic vayan a tirones.


## Gestión de listas y grandes volúmenes de datos

### Buenas Prácticas

```
● Uso de trackBy: En detail.page.html, se usa trackBy: trackByComment. Esto permite
a Angular identificar qué elementos han cambiado y reutilizar los nodos del DOM
existentes, mejorando drásticamente el rendimiento al actualizar la lista.
● Volumen controlado: Renderiza solo los datos necesarios devueltos por la API.
```
### Malas Prácticas

```
● Sin trackBy: Al usar *ngFor="let c of comments", Angular destruye y recrea todo el
árbol DOM de la lista ante cualquier cambio.
● Lista inflada: El código fuerza una lista de 500 elementos (big.push(...data)), violando
el principio de minimizar elementos visibles.
```
## Optimización de eventos y gestos

### Buenas Prácticas

```
● La interacción es fluida porque el hilo principal de JavaScript está libre.
```
### Malas Prácticas

```
● Debido a la función prettyEmail pesada ejecutándose en el template, cualquier
evento táctil (scroll, click) sufre retraso (jank), ya que el navegador está ocupado
haciendo cálculos inútiles.
```
## Reducción de peticiones HTTP

### Buenas Prácticas

```
● Reutilización: SocialBadService usa el operador shareReplay(1). Si varios
componentes piden los mismos datos, o si se navega y se vuelve, no se hace una
nueva petición de red.
```
### Malas Prácticas

```
● Peticiones duplicadas: En DetailPage, se llama a this.api.getComments dos veces
seguidas en el ngOnInit. Esto genera dos peticiones HTTP idénticas al servidor
simultáneamente, desperdiciando ancho de banda y batería.
```

## Cacheo y reutilización de datos

### Buenas Prácticas

```
● Caché en memoria: Implementa un patrón de caché simple: if (!this.postsCache$) {
... }. Esto reduce la latencia a 0ms en segundas visitas.
```
### Malas Prácticas

```
● Sin caché: Cada visita a la página de detalle implica esperar a la red, afectando la
experiencia de usuario (UX) y aumentando el consumo de datos móviles.
```
## Gestión correcta de observables y suscripciones

### Buenas Prácticas

```
● Async Pipe: En el HTML usa *ngIf="comments$ | async as comments". El AsyncPipe
se suscribe automáticamente al iniciar el componente y se desuscribe
automáticamente al destruirlo.
● Cero fugas: El KPI activeSubscriptions se mantiene estable.
```
### Malas Prácticas

```
● Suscripción manual: Usa .subscribe() explícito en el ts.
● Fuga de memoria (Memory Leak): No implementa ngOnDestroy ni usa takeUntil o
unsubscribe(). Cada vez que el usuario entra y sale de la página, las suscripciones
se quedan vivas en memoria, observando datos que ya no se ven. El KPI
activeSubscriptions crece indefinidamente.
```

