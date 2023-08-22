const quantityInputs = document.querySelectorAll('.quantity');
quantityInputs.forEach((input) => {
    input.addEventListener('input', updatePrice);
});
function updateCartItemQuantity( itemId, quantity) {
    
    fetch('/updateCartItemQuantity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId:itemId,
        quantity:quantity
      }),
    }).then((response) => response.json())
    .then((data) => {
      console.log(data.message); 
    })
    .catch((error) => console.error('Error:', error));
  }
  function toUpdateTotal(){
    const allPricetag=document.querySelectorAll('.pricetag');
  function extractNumberFromInnerText(innerText) {
    const numericString = innerText.split("$")[1]; 
    return parseFloat(numericString);
  }
  let totalSum = 0;
  allPricetag.forEach((pricetag) => {
    const innerText = pricetag.innerText;
    const price = extractNumberFromInnerText(innerText);
    totalSum += price;
  });
  const totSum=document.getElementById('totPrice');
  totSum.innerText= "Total: $"+totalSum.toFixed(2);
  const actualCost="/DETAILOFUSER?param1="+totalSum.toFixed(2);
  totSum.setAttribute("href",actualCost);
  }

 function updatePrice(event) {
    const input = event.target;
    const row = input.closest('tr');
    const priceCell = row.querySelector('.pricetag');
    const currentPrice=row.querySelector('.quantity').getAttribute('data-price').split("$")[1];
   
    if (!isNaN(input.value) && input.value >= 1) {
        const quantity = parseInt(input.value);
        const totalPrice = (quantity * currentPrice).toFixed(2);
        priceCell.innerText = "$"+totalPrice;
       toUpdateTotal();
    const iditem=priceCell.getAttribute('data-price');
    
    updateCartItemQuantity(iditem,quantity);}
}
toUpdateTotal();

