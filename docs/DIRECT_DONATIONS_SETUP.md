# Dons directs - Prompt 4.5

Ce document decrit l'ajout des dons directs au systeme finance MegVie Paris.
Il complete le systeme Stripe du Prompt 4 sans le remplacer.

## Objectif

Le registre des dons supporte maintenant deux sources:

- `ONLINE`: paiements Stripe. Stripe webhook reste l'autorite.
- `DIRECT`: dons recus en main propre, especes, enveloppes ou collectes.

Seuls les dons directs `VERIFIED` comptent dans les totaux officiels. Les dons
directs `RECORDED` restent visibles comme travaux a verifier. Les dons directs
`CANCELLED` restent dans l'audit, mais ne comptent pas.

## Migration

Migration creee:

`prisma/migrations/20260624120000_direct_cash_donations/migration.sql`

Elle ajoute:

- enum `donation_source`: `ONLINE`, `DIRECT`
- enum `direct_donation_kind`: `IDENTIFIED`, `ANONYMOUS_COLLECTION`
- enum `direct_donation_status`: `RECORDED`, `VERIFIED`, `CANCELLED`
- colonnes directes sur `donations`
- liens optionnels vers `church_events` et les admins qui saisissent/verifient/annulent
- contraintes SQL de separation entre Stripe et dons directs

Ne pas appliquer automatiquement cette migration sur production. Executer le
process Prisma habituel apres revue.

## Workflow admin

Routes ajoutees:

- `/admin/dons/directs`
- `/admin/dons/directs/nouveau`
- `/admin/dons/directs/[id]`

Roles autorises:

- `FINANCE`: saisir, verifier, annuler un don direct non verifie
- `MASTER`: memes droits, plus annulation/correction d'un don verifie
- `CREATOR`: memes droits que Master

Un don direct identifie doit cibler un membre actif avec un ID MegVie valide.
Une collecte anonyme ne cible aucun membre et ne cree aucune notification membre.

## Corrections

Un don direct verifie n'est pas edite en place. Une correction:

1. annule l'entree verifiee d'origine,
2. cree une nouvelle entree de remplacement en `RECORDED`,
3. garde le lien `replacesDonationId`,
4. ecrit deux lignes d'audit.

Cela evite d'effacer l'historique comptable.

## Notifications

Les notifications de dons directs sont personnelles et sobres:

- aucune somme,
- aucune categorie,
- aucun nom d'admin,
- aucun detail de collecte visible dans le push.

Elles renvoient vers `/espace-membre/dons`.

## Finance

La page `/admin/finance` affiche maintenant:

- total Stripe net,
- total des dons directs verifies,
- montant direct en attente de verification,
- total officiel combine.

Les filtres et exports CSV incluent `source`, `directStatus`, `directKind`,
l'evenement, le libelle de collecte, les references internes et les acteurs
admin. Les lignes directes n'ont jamais de fausse reference Stripe.

## Historique membre

`/espace-membre/dons` affiche les dons Stripe et les dons directs rattaches au
membre connecte. Les collectes anonymes n'ont pas de `userId`, donc elles ne
s'affichent dans aucun historique personnel.

## Stripe

Le webhook Stripe ne traite que les dons `ONLINE`. Les dons directs gardent les
champs Stripe a `NULL`; la contrainte SQL empeche l'utilisation de faux IDs
Stripe.

## Checklist de verification

- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Ne pas lancer `npm run smoke:stripe` avec une cle live. Utiliser uniquement les
cles de test Stripe.

## Rollback

Rollback applicatif:

1. retirer les routes `/admin/dons/directs`,
2. retirer les filtres direct de `/admin/finance`,
3. revenir a la migration precedente si aucune donnee directe n'a ete saisie.

Rollback base apres donnees reelles:

- exporter les lignes `source = DIRECT`,
- conserver l'audit,
- planifier une migration de suppression separee.
