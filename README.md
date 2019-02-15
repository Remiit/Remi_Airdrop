# Remi_Airdrop

> ## Initialize
1. set configration in .env file
2. modify query in js/tableResort.js to fit your database
3. run js/tableResort.js

> ## Ready node
1. run js/_Server.js
2. access localhost:8081 on browser to check

> ## Transact
1. access /aTransactor on browser
2. input txIndex, gasLimit and gasPrice
    1. if you wanna transact with too low/high limit/price, check it is valid.
    2. if you wanna transact only once, check stop automate
3. click SendTx button to transact
    1. after successful transaction, log will be green.
    2. if it is fail, log will be red and automator will stop.
    3. if it isnt answer for 600s, log will be yellow and automator will stop.

> ## Vaildate
1. access /aValidator on browser
2. input txIndex from and to (to should be last txIndex for sync)
    1. if u wanna compare with final value (from database), check final check
    2. if u wanna update database, check it
3. click Validate button to validate  
    1. log will be yellow if all users balance is right
    2. log will be red if one or more users balance is wrong
    3. log will be green when all users balance is equal to database