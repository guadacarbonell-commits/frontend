// Variables de estado global para la paginación y datos
let allProducts = [];
const PRODUCTS_PER_PAGE = 20;
let currentIndex = 0;


// Variables de elementos DOM, se inicializarán solo cuando el DOM esté listo.
let productosContainer, loadMoreBtn, loadingMessage, noMoreProductsMessage;


/**
 * Crea un elemento de tarjeta de producto con clases de Bootstrap.
 * Nota: El código genera un div.col que contiene el div.card
 * para integrarse correctamente con el sistema de grid de Bootstrap (row-cols-*).
 * @param {object} producto - Objeto con los datos del producto de la API.
 */
function crearTarjetaProducto(producto) {
    // Usamos las variables globales que se inicializaron en init()
    if (!productosContainer) {
        console.error('El contenedor de productos no se ha inicializado. Verifique la función init().');
        return;
    }
   
    if (!producto.name || !producto.price || !producto.image_link) {
        console.warn('Producto omitido por falta de datos esenciales:', producto);
        return;
    }


    // 1. Crear el wrapper de columna (col) para la cuadrícula de Bootstrap
    const col = document.createElement('div');
    col.classList.add('col');


    // 2. Crear la tarjeta (div.card)
    const card = document.createElement('div');
    // ASIGNAR ID ÚNICO BASADO EN EL ID DEL PRODUCTO
    card.setAttribute('id', 'product-' + producto.id);
    // La clase 'h-100' asegura que todas las tarjetas tengan la misma altura dentro del grid
    card.classList.add('card', 'h-100', 'shadow-lg');


    // 3. Imagen (card-img-top)
    const imagen = document.createElement('img');
    imagen.src = producto.image_link;
    imagen.alt = `Imagen de ${producto.name}`;
    imagen.classList.add('card-img-top', 'card-img-top-fixed');
   
    // Manejo de error si la imagen no carga
    imagen.onerror = function() {
        this.onerror = null;
        // Color de placeholder ajustado a un verde oscuro (#00522c) para Majesty Nails
        this.src = `https://placehold.co/400x192/00522c/ffffff?text=${encodeURIComponent(producto.name)}`;
    };


    // 4. Cuerpo de la tarjeta (card-body)
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body', 'd-flex', 'flex-column', 'justify-content-between');


    // 5. Contenido Superior (Título y Precio)
    const contentDiv = document.createElement('div');


    const nombre = document.createElement('h5');
    nombre.textContent = producto.name;
    nombre.classList.add('card-title', 'text-truncate');


    const precio = document.createElement('p');
    // Usamos el precio del producto como el texto principal
    precio.textContent = `Precio: $${parseFloat(producto.price || 0).toFixed(2)}`;
    // Se usa text-success para que el precio destaque en verde
    precio.classList.add('product-price', 'mb-2', 'text-success');
   
    contentDiv.appendChild(nombre);
    contentDiv.appendChild(precio);


    // 6. Color (Información adicional)
    if (producto.product_colors && producto.product_colors.length > 0) {
        const colorInfo = document.createElement('div');
        colorInfo.classList.add('d-flex', 'align-items-center', 'mb-3');
       
        const primerColor = producto.product_colors[0];
       
        const swatch = document.createElement('span');
        swatch.style.cssText = `
            display: inline-block;
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 50%;
            margin-right: 0.5rem;
            border: 1px solid #ccc;
            background-color: ${primerColor.hex_value || '#000000'};
        `;


        const colorText = document.createElement('span');
        colorText.textContent = `Color: ${primerColor.colour_name || 'N/A'}`;
        colorText.classList.add('text-muted', 'small');


        colorInfo.appendChild(swatch);
        colorInfo.appendChild(colorText);
        contentDiv.appendChild(colorInfo);
    }
   
    // 7. Contenedor de Botones
    const btnContainer = document.createElement('div');
    btnContainer.classList.add('d-flex', 'gap-2', 'mt-auto');
   
    // Botón Detalles (Condicional: solo si hay descripción)
    const hasDescription = producto.description && producto.description.trim().length > 0;
   
    if (hasDescription) {
        const btnDetalles = document.createElement('button');
        btnDetalles.textContent = 'Ver Detalles';
        btnDetalles.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'flex-grow-1');
        btnDetalles.onclick = () => {
            alert(`Descripción de ${producto.name}:\n\n${producto.description}`);
        };
        btnContainer.appendChild(btnDetalles);
    }


    // Botón Comprar
    const btnComprar = document.createElement('button');
    btnComprar.textContent = 'Comprar';
    btnComprar.onclick = () => console.log(`Producto ${producto.name} añadido al carrito.`);
   
    // Si NO hay botón de detalles, el botón de Comprar ocupa todo el ancho
    if (!hasDescription) {
        btnComprar.classList.add('btn', 'btn-sm', 'btn-success', 'w-100'); // Usamos btn-success (verde)
    } else {
        btnComprar.classList.add('btn', 'btn-sm', 'btn-success', 'flex-grow-1');
    }
   
    btnContainer.appendChild(btnComprar);


    // 8. Ensamblar la tarjeta completa
    cardBody.appendChild(contentDiv);
    cardBody.appendChild(btnContainer);
   
    card.appendChild(imagen);
    card.appendChild(cardBody);


    col.appendChild(card);
   
    // AÑADIR LA COLUMNA (con la tarjeta) al CONTENEDOR PRINCIPAL
    productosContainer.appendChild(col);
}


/**
 * Muestra el siguiente lote de 20 productos.
 */
function renderNextBatch() {
    // Deshabilitar botón y mostrar carga
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Cargando...';


    // Determinar el final del lote
    const endIndex = currentIndex + PRODUCTS_PER_PAGE;
    // Obtener el lote de productos
    const batch = allProducts.slice(currentIndex, endIndex);


    // Renderizar los productos uno por uno
    batch.forEach(crearTarjetaProducto);


    // Actualizar el índice para la próxima carga
    currentIndex = endIndex;


    // Habilitar botón y verificar si hay más productos
    if (currentIndex < allProducts.length) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Cargar más productos';
    } else {
        // Si no hay más productos, ocultar el botón y mostrar el mensaje final
        loadMoreBtn.style.display = 'none';
        noMoreProductsMessage.style.display = 'block';
    }
}


/**
 * LÓGICA DE FETCHING DE DATOS PRINCIPAL
 */
async function obtenerYRenderizarProductos() {
    // Usamos HTTPS para evitar el error de Mixed Content
    // Se usa un filtro para reducir la carga de datos inicial.
    const apiUrl = 'https://makeup-api.herokuapp.com/api/v1/products.json?product_type=eyeliner';
   
    try {
        // 1. Mostrar mensaje de carga
        // El mensaje de carga está oculto por defecto en el HTML (d-none), lo mostramos aquí
        loadingMessage.classList.remove('d-none');
        loadingMessage.classList.add('d-block');
       
        // 2. Fetch con backoff
        const response = await fetchWithRetry(apiUrl, 3);
       
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
       
        const data = await response.json();
       
        // 3. Almacenar todos los datos
        allProducts = data;
       
        // 4. Ocultar mensaje de carga
        loadingMessage.classList.remove('d-block');
        loadingMessage.classList.add('d-none');


        if (allProducts.length === 0) {
            productosContainer.innerHTML = '<div class="col-12 text-center text-muted p-5">No se encontraron productos.</div>';
        } else {
            // 5. Renderizar el primer lote de 20
            renderNextBatch();
            // 6. Mostrar el botón si hay más productos para cargar
            if (allProducts.length > PRODUCTS_PER_PAGE) {
                loadMoreBtn.style.display = 'block';
            } else {
                // Si todos los productos caben en la primera carga, no mostramos el botón "Cargar más"
                noMoreProductsMessage.style.display = 'block';
            }
        }


    } catch (error) {
        console.error('Error al obtener o procesar los productos:', error);
        // Mostrar un mensaje de error legible para el usuario
        loadingMessage.classList.remove('d-block');
        loadingMessage.classList.add('d-none');
        productosContainer.innerHTML = `<div class="col-12 text-center text-danger p-5 fw-bold">
            Error al cargar los productos: ${error.message}. Por favor, inténtelo de nuevo.
        </div>`;
    }
}


/**
 * Implementa la lógica de reintento con backoff exponencial.
 */
async function fetchWithRetry(url, retries) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return response;
            }
            if (i === retries - 1) throw new Error(`Fetch failed after ${retries} attempts.`);


        } catch (error) {
            const delay = Math.pow(2, i) * 1000;
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
}


/**
 * Función de inicialización principal.
 * Inicializa las variables DOM y los listeners.
 */
function init() {
    // Inicialización de variables DOM (Ahora es seguro acceder a ellas)
    productosContainer = document.getElementById('productos-container');
    loadMoreBtn = document.getElementById('load-more-btn');
    loadingMessage = document.getElementById('loading-message');
    noMoreProductsMessage = document.getElementById('no-more-products');


    // Comprobación de que todos los elementos se encontraron
    if (!productosContainer || !loadMoreBtn || !loadingMessage || !noMoreProductsMessage) {
        console.error('ERROR CRÍTICO: No se pudieron encontrar uno o más elementos DOM. Asegúrese de que todos los IDs sean correctos en index.html.');
        return;
    }


    // Asignar el evento al botón solo después de que se inicialice
    loadMoreBtn.addEventListener('click', renderNextBatch);
   
    // Iniciar la carga de productos
    obtenerYRenderizarProductos();
}


// Llamada de inicio al cargar la página usando DOMContentLoaded para mayor fiabilidad
document.addEventListener('DOMContentLoaded', init);

//fin
