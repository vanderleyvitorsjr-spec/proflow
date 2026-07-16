"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";

import { BibliotecaTecnicaCategories, type TechnicalLibraryGroup } from "./biblioteca-tecnica-categories";
import {
  categoryOptions,
  contentTypeOptions,
  equipmentOptions,
  manufacturerOptions,
  technicalDocuments,
  type TechnicalLibraryView,
} from "./biblioteca-tecnica-data";
import { BibliotecaTecnicaDocuments } from "./biblioteca-tecnica-documents";
import { BibliotecaTecnicaHeader } from "./biblioteca-tecnica-header";
import { BibliotecaTecnicaHighlights } from "./biblioteca-tecnica-highlights";

export function BibliotecaTecnicaPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [manufacturerFilter, setManufacturerFilter] = useState("ALL");
  const [contentTypeFilter, setContentTypeFilter] = useState("ALL");
  const [view, setView] = useState<TechnicalLibraryView>("cards");
  const [activeGroup, setActiveGroup] = useState<TechnicalLibraryGroup>("category");
  const [showMockNotice, setShowMockNotice] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(
    () => new Set(technicalDocuments.filter((document) => document.isFavorite).map((document) => document.id)),
  );

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");

    return technicalDocuments.filter((document) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          document.title,
          document.description,
          document.code,
          document.manufacturer,
          document.equipment,
          ...document.tags,
          ...document.equipmentCodes,
          ...document.serviceOrderReferences,
        ].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedSearch));

      return (
        matchesSearch &&
        (categoryFilter === "ALL" || document.category === categoryFilter) &&
        (manufacturerFilter === "ALL" || document.manufacturer === manufacturerFilter) &&
        (contentTypeFilter === "ALL" || document.contentType === contentTypeFilter)
      );
    });
  }, [categoryFilter, contentTypeFilter, manufacturerFilter, searchTerm]);

  const favoriteDocuments = technicalDocuments.filter((document) => favoriteIds.has(document.id));
  const recentDocuments = technicalDocuments.filter((document) => document.isRecent);
  const mostViewedDocuments = [...technicalDocuments].sort((first, second) => second.views - first.views);

  function toggleFavorite(documentId: string) {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <BibliotecaTecnicaHeader
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        manufacturerFilter={manufacturerFilter}
        contentTypeFilter={contentTypeFilter}
        view={view}
        categories={categoryOptions}
        manufacturers={manufacturerOptions}
        contentTypes={contentTypeOptions}
        onSearchChange={setSearchTerm}
        onCategoryChange={setCategoryFilter}
        onManufacturerChange={setManufacturerFilter}
        onContentTypeChange={setContentTypeFilter}
        onViewChange={setView}
        onNewDocument={() => setShowMockNotice(true)}
      />

      {showMockNotice && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Cadastro demonstrativo: upload e persistência serão habilitados em uma integração futura.
          </span>
          <button type="button" className="font-semibold underline" onClick={() => setShowMockNotice(false)}>
            Entendi
          </button>
        </div>
      )}

      <BibliotecaTecnicaCategories
        documentCount={technicalDocuments.length}
        categoryCount={categoryOptions.length}
        equipmentCount={equipmentOptions.length}
        manufacturerCount={manufacturerOptions.length}
        contentTypeCount={contentTypeOptions.length}
        activeGroup={activeGroup}
        onGroupChange={setActiveGroup}
      />

      <div className="flex flex-wrap items-center gap-2" aria-label="Resumo da organização ativa">
        <Badge variant="info">
          Organização: {activeGroup === "category" ? "Categorias" : activeGroup === "equipment" ? "Equipamentos" : activeGroup === "manufacturer" ? "Fabricantes" : "Tipos de conteúdo"}
        </Badge>
        <Badge variant="neutral">{equipmentOptions.length} equipamentos</Badge>
        <Badge variant="neutral">{manufacturerOptions.length} fabricantes</Badge>
        <Badge variant="neutral">{contentTypeOptions.length} tipos</Badge>
      </div>

      <BibliotecaTecnicaHighlights
        recent={recentDocuments}
        favorites={favoriteDocuments}
        mostViewed={mostViewedDocuments}
      />

      <BibliotecaTecnicaDocuments
        documents={filteredDocuments}
        view={view}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}

export default BibliotecaTecnicaPageContent;
