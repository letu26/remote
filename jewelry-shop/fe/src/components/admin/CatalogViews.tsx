"use client";

import { CrudPage } from "./CrudPage";
import { categoryConfig, collectionConfig, gemstoneConfig, materialConfig } from "./catalog-configs";

export const CategoriesView = () => <CrudPage config={categoryConfig} />;
export const MaterialsView = () => <CrudPage config={materialConfig} />;
export const GemstonesView = () => <CrudPage config={gemstoneConfig} />;
export const CollectionsView = () => <CrudPage config={collectionConfig} />;
